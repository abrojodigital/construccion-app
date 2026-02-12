'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Material {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  currentStock: string;
  minimumStock: string;
  maximumStock: string | null;
  lastPurchasePrice: string | null;
  isActive: boolean;
  category: { id: string; name: string; code: string };
}

interface MaterialsResponse {
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Category {
  id: string;
  name: string;
  code: string;
}

export default function MaterialsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: categories } = useQuery({
    queryKey: ['material-categories'],
    queryFn: () => api.get<Category[]>('/materials/categories/all'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['materials', page, search, categoryFilter],
    queryFn: () =>
      api.get<MaterialsResponse>('/materials', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        },
      }),
  });

  const isLowStock = (material: Material) => {
    return Number(material.currentStock) <= Number(material.minimumStock);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
          <p className="text-muted-foreground">Catalogo de materiales y control de stock</p>
        </div>
        <Link href="/materials/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Material
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, codigo..."
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
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Ultimo Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay materiales registrados</p>
                      <Link href="/materials/new">
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar material
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Badge variant="outline">{material.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/materials/${material.id}`}
                        className="font-medium hover:underline"
                      >
                        {material.name}
                      </Link>
                      {material.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {material.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{material.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{material.unit}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isLowStock(material) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className={isLowStock(material) ? 'text-yellow-600 font-medium' : ''}>
                          {Number(material.currentStock).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Min: {Number(material.minimumStock).toLocaleString('es-AR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {material.lastPurchasePrice
                        ? formatCurrency(Number(material.lastPurchasePrice))
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={material.isActive ? 'success' : 'secondary'}>
                        {material.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/materials/${material.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/materials/${material.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
