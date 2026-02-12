# Deploy en AWS con Docker - Sistema de Gestión de Construcción

Esta guía explica cómo deployar la aplicación usando **Docker** en **AWS** con ECS (Elastic Container Service) y RDS (PostgreSQL).

---

## Arquitectura en AWS

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │   (DNS)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CloudFront    │
                    │   (CDN)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ALB           │
                    │   (Load Balancer)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   ECS       │   │   ECS       │   │   ECS       │
    │   Web       │   │   API       │   │   API       │
    │   (Fargate) │   │   (Fargate) │   │   (Fargate) │
    └─────────────┘   └──────┬──────┘   └──────┬──────┘
                             │                 │
                    ┌────────▼─────────────────▼────────┐
                    │            RDS PostgreSQL         │
                    │            (Multi-AZ)             │
                    └───────────────────────────────────┘
```

---

## Prerequisitos

1. **Cuenta de AWS** con permisos de administrador
2. **AWS CLI** instalado y configurado
3. **Docker** instalado localmente
4. Código del proyecto listo

### Instalar AWS CLI

```bash
# macOS
brew install awscli

# O descargar desde: https://aws.amazon.com/cli/

# Configurar credenciales
aws configure
# AWS Access Key ID: <tu-access-key>
# AWS Secret Access Key: <tu-secret-key>
# Default region: us-east-1 (o tu región preferida)
# Default output format: json
```

---

## Paso 1: Crear repositorio en ECR (Elastic Container Registry)

ECR es el registro de Docker de AWS donde subiremos nuestras imágenes.

```bash
# Variables (ajustar según tu cuenta)
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Crear repositorios para API y Web
aws ecr create-repository \
  --repository-name construccion-app/api \
  --region $AWS_REGION

aws ecr create-repository \
  --repository-name construccion-app/web \
  --region $AWS_REGION

# Autenticar Docker con ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

---

## Paso 2: Construir y subir imágenes Docker

```bash
cd /Users/pablobersier/desarrollo/construccion-app

# Construir imagen de la API
docker build -t construccion-app/api:latest -f apps/api/Dockerfile .

# Construir imagen del Web (ajustar URLs)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://tu-dominio.com \
  -t construccion-app/web:latest \
  -f apps/web/Dockerfile .

# Etiquetar para ECR
docker tag construccion-app/api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/api:latest
docker tag construccion-app/web:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/web:latest

# Subir a ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/api:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/web:latest
```

---

## Paso 3: Crear base de datos RDS (PostgreSQL)

### 3.1 Crear VPC (si no existe)

```bash
# Crear VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=construccion-vpc}]'

# Guardar el VPC_ID
export VPC_ID=<vpc-id-del-output>

# Crear subnets (necesitas al menos 2 en diferentes AZs para RDS)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=construccion-subnet-1}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=construccion-subnet-2}]'
```

### 3.2 Crear Security Group para RDS

```bash
# Crear security group
aws ec2 create-security-group \
  --group-name construccion-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id $VPC_ID

export RDS_SG_ID=<security-group-id>

# Permitir tráfico PostgreSQL desde el VPC
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
```

### 3.3 Crear instancia RDS

```bash
# Crear DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name construccion-db-subnet \
  --db-subnet-group-description "Subnet group for construccion DB" \
  --subnet-ids <subnet-1-id> <subnet-2-id>

# Crear instancia PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier construccion-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password "TuPasswordSeguro123!" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name construccion-db-subnet \
  --db-name construccion_db \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --storage-encrypted

# Esperar a que esté disponible (puede tomar ~10 minutos)
aws rds wait db-instance-available --db-instance-identifier construccion-db

# Obtener el endpoint
aws rds describe-db-instances \
  --db-instance-identifier construccion-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

## Paso 4: Crear cluster ECS con Fargate

### 4.1 Crear cluster ECS

```bash
aws ecs create-cluster \
  --cluster-name construccion-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=1
```

### 4.2 Crear IAM Role para tareas ECS

```bash
# Crear archivo de política de confianza
cat > ecs-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear rol
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Adjuntar política
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Limpiar
rm ecs-trust-policy.json
```

### 4.3 Crear Task Definition para la API

```bash
cat > api-task-definition.json << EOF
{
  "family": "construccion-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/api:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"},
        {"name": "JWT_EXPIRES_IN", "value": "30m"},
        {"name": "JWT_REFRESH_EXPIRES_IN", "value": "7d"},
        {"name": "CORS_ORIGIN", "value": "https://tu-dominio.com"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:construccion/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:construccion/jwt-secret"
        },
        {
          "name": "JWT_REFRESH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:construccion/jwt-refresh-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/construccion-api",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
EOF

# Crear log group
aws logs create-log-group --log-group-name /ecs/construccion-api

# Registrar task definition
aws ecs register-task-definition --cli-input-json file://api-task-definition.json
```

### 4.4 Crear Task Definition para el Web

```bash
cat > web-task-definition.json << EOF
{
  "family": "construccion-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/construccion-app/web:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/construccion-web",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Crear log group
aws logs create-log-group --log-group-name /ecs/construccion-web

# Registrar task definition
aws ecs register-task-definition --cli-input-json file://web-task-definition.json
```

---

## Paso 5: Crear secrets en AWS Secrets Manager

```bash
# Crear secret para DATABASE_URL
aws secretsmanager create-secret \
  --name construccion/database-url \
  --secret-string "postgresql://postgres:TuPasswordSeguro123!@<RDS-ENDPOINT>:5432/construccion_db"

# Generar y crear secrets JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

aws secretsmanager create-secret \
  --name construccion/jwt-secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name construccion/jwt-refresh-secret \
  --secret-string "$JWT_REFRESH_SECRET"
```

**IMPORTANTE**: Actualizar la política del rol ecsTaskExecutionRole para acceder a Secrets Manager:

```bash
cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:construccion/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document file://secrets-policy.json
```

---

## Paso 6: Crear Application Load Balancer (ALB)

```bash
# Crear security group para ALB
aws ec2 create-security-group \
  --group-name construccion-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID

export ALB_SG_ID=<security-group-id>

# Permitir tráfico HTTP y HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Crear ALB
aws elbv2 create-load-balancer \
  --name construccion-alb \
  --subnets <subnet-1-id> <subnet-2-id> \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application

export ALB_ARN=<load-balancer-arn>

# Crear target groups
aws elbv2 create-target-group \
  --name construccion-api-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/v1/health

aws elbv2 create-target-group \
  --name construccion-web-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /

export API_TG_ARN=<api-target-group-arn>
export WEB_TG_ARN=<web-target-group-arn>

# Crear listener HTTP (redirecciona a HTTPS en producción)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$WEB_TG_ARN

# Agregar regla para API (/api/*)
aws elbv2 create-rule \
  --listener-arn <listener-arn> \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=$API_TG_ARN
```

---

## Paso 7: Crear servicios ECS

```bash
# Crear security group para ECS tasks
aws ec2 create-security-group \
  --group-name construccion-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $VPC_ID

export ECS_SG_ID=<security-group-id>

# Permitir tráfico desde ALB
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3001 \
  --source-group $ALB_SG_ID

# Crear servicio API
aws ecs create-service \
  --cluster construccion-cluster \
  --service-name construccion-api \
  --task-definition construccion-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1-id>,<subnet-2-id>],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$API_TG_ARN,containerName=api,containerPort=3001"

# Crear servicio Web
aws ecs create-service \
  --cluster construccion-cluster \
  --service-name construccion-web \
  --task-definition construccion-web \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1-id>,<subnet-2-id>],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$WEB_TG_ARN,containerName=web,containerPort=3000"
```

---

## Paso 8: Ejecutar migraciones de Prisma

Para ejecutar las migraciones, necesitas una tarea temporal:

```bash
# Ejecutar tarea temporal para migraciones
aws ecs run-task \
  --cluster construccion-cluster \
  --task-definition construccion-api \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1-id>],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "api",
      "command": ["sh", "-c", "npx prisma migrate deploy"]
    }]
  }'
```

---

## Paso 9: Configurar dominio (Route 53)

```bash
# Si tienes un dominio en Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id <tu-hosted-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.tu-dominio.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB-hosted-zone-id>",
          "DNSName": "<ALB-dns-name>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

## Costos estimados (AWS)

| Servicio | Configuración | Costo estimado |
|----------|---------------|----------------|
| ECS Fargate | 2 tareas API + 2 tareas Web (256 CPU, 512 MB) | ~$30-40/mes |
| RDS PostgreSQL | db.t3.micro, 20 GB | ~$15-20/mes |
| ALB | 1 Load Balancer | ~$20/mes |
| ECR | 2 repositorios, <1 GB | ~$1/mes |
| CloudWatch Logs | Logs básicos | ~$5/mes |
| **Total** | | **~$70-90/mes** |

Para producción con más tráfico, considerar:
- RDS db.t3.small o medium
- ECS con más réplicas
- ElastiCache para caché

---

## Alternativa: AWS App Runner (más simple)

Si preferís una opción más simple (similar a Railway/Vercel):

```bash
# Crear servicio con App Runner
aws apprunner create-service \
  --service-name construccion-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/construccion-app/api:latest",
      "ImageRepositoryType": "ECR"
    }
  }' \
  --instance-configuration '{
    "Cpu": "256",
    "Memory": "512"
  }'
```

---

## Comandos útiles

```bash
# Ver logs de un servicio
aws logs tail /ecs/construccion-api --follow

# Actualizar servicio (force new deployment)
aws ecs update-service \
  --cluster construccion-cluster \
  --service construccion-api \
  --force-new-deployment

# Ver estado de servicios
aws ecs describe-services \
  --cluster construccion-cluster \
  --services construccion-api construccion-web

# Escalar servicio
aws ecs update-service \
  --cluster construccion-cluster \
  --service construccion-api \
  --desired-count 3
```

---

## CI/CD con GitHub Actions

Crear `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  ECS_CLUSTER: construccion-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push API
        run: |
          docker build -t $ECR_REGISTRY/construccion-app/api:${{ github.sha }} -f apps/api/Dockerfile .
          docker push $ECR_REGISTRY/construccion-app/api:${{ github.sha }}
          docker tag $ECR_REGISTRY/construccion-app/api:${{ github.sha }} $ECR_REGISTRY/construccion-app/api:latest
          docker push $ECR_REGISTRY/construccion-app/api:latest

      - name: Build and push Web
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_URL=${{ secrets.API_URL }} \
            --build-arg NEXT_PUBLIC_APP_URL=${{ secrets.APP_URL }} \
            -t $ECR_REGISTRY/construccion-app/web:${{ github.sha }} \
            -f apps/web/Dockerfile .
          docker push $ECR_REGISTRY/construccion-app/web:${{ github.sha }}
          docker tag $ECR_REGISTRY/construccion-app/web:${{ github.sha }} $ECR_REGISTRY/construccion-app/web:latest
          docker push $ECR_REGISTRY/construccion-app/web:latest

      - name: Deploy API to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service construccion-api \
            --force-new-deployment

      - name: Deploy Web to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service construccion-web \
            --force-new-deployment
```

---

## Troubleshooting

### Error: "Task stopped - Essential container exited"
- Revisar logs en CloudWatch: `/ecs/construccion-api`
- Verificar que todas las variables de entorno están configuradas
- Verificar conectividad con RDS (security groups)

### Error: "Unable to pull image"
- Verificar que el rol de ejecución tiene permisos ECR
- Verificar que la imagen existe en ECR

### Error: "Unhealthy targets"
- Verificar que el health check path es correcto
- Revisar logs de la aplicación
- Verificar security groups permiten tráfico del ALB

### Error: "Database connection refused"
- Verificar que RDS está en el mismo VPC
- Verificar security groups de RDS permiten tráfico desde ECS

---

*Guía de deploy AWS para el Sistema de Gestión de Construcción*
