# Sample Terraform HCL Configuration for Infrastructure Change Testing
# Scenario: PostgreSQL RDS resizing and connection parameter group modification

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "production-vpc"
  }
}

resource "aws_security_group" "db_sg" {
  name        = "aurora-pg-sg"
  description = "Controls ingress traffic to database tier"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "Postgres connection port"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.10.0/24", "10.0.11.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_parameter_group" "pg_params" {
  name   = "rds-pg15-custom-params"
  family = "postgres15"

  parameter {
    name  = "max_connections"
    value = "50"
  }

  parameter {
    name  = "statement_timeout"
    value = "30000"
  }
}

resource "aws_db_instance" "postgres_primary" {
  identifier           = "production-core-db"
  allocated_storage    = 100
  max_allocated_storage = 500
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t4g.small"
  parameter_group_name = aws_db_parameter_group.pg_params.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot  = true
  multi_az             = false
  deletion_protection  = true
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id           = "checkout-session-cache"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
