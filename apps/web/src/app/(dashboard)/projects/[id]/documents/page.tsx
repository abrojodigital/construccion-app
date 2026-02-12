'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Search,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Eye,
  FolderOpen,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string };
}

interface ProjectSummary {
  code: string;
  name: string;
}

const documentCategories = [
  { value: 'all', label: 'Todas las categorias' },
  { value: 'PLANOS', label: 'Planos' },
  { value: 'PERMISOS', label: 'Permisos' },
  { value: 'CONTRATOS', label: 'Contratos' },
  { value: 'FACTURAS', label: 'Facturas' },
  { value: 'FOTOS', label: 'Fotos' },
  { value: 'INFORMES', label: 'Informes' },
  { value: 'OTROS', label: 'Otros' },
];

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('OTROS');

  const { data: project } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => api.get<ProjectSummary>(`/projects/${projectId}`),
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['project-documents', projectId, categoryFilter],
    queryFn: () =>
      api.get<Document[]>(`/projects/${projectId}/documents`, {
        params: {
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        },
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      return api.post(`/projects/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Documento subido exitosamente');
    },
    onError: () => {
      toast.error('Error al subir el documento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      api.delete(`/projects/${projectId}/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Documento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el documento');
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('pdf')) return FileText;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents?.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByCategory = filteredDocuments?.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{project?.code}</Badge>
            </div>
            <h1 className="text-3xl font-bold">Documentos del Proyecto</h1>
            <p className="text-muted-foreground">{project?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={uploadCategory} onValueChange={setUploadCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {documentCategories.slice(1).map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? 'Subiendo...' : 'Subir Documento'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Documentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {documents?.filter((d) => d.category === 'PLANOS').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Planos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {documents?.filter((d) => d.category === 'FOTOS').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Fotos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {documents?.filter((d) => d.category === 'PERMISOS').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Permisos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
            <p className="text-muted-foreground mb-4">
              Sube el primer documento para este proyecto
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          </CardContent>
        </Card>
      ) : categoryFilter === 'all' ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedByCategory || {}).map(([category, docs]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">
                {documentCategories.find((c) => c.value === category)?.label || category}
                <Badge variant="secondary" className="ml-2">
                  {docs.length}
                </Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-muted rounded-lg">
                              <FileIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.size)} • {formatDate(doc.createdAt)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Por {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={doc.url} download={doc.name}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Descargar
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(doc.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat view for filtered category
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments?.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • {formatDate(doc.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Por {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={doc.url} download={doc.name}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
