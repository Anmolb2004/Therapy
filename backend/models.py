# backend/models.py
import os
import json
import boto3
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    """
    Constructs the database URL, fetching credentials securely from AWS Secrets Manager
    when running in the cloud, or using a default for local Docker development.
    """
    db_secret_arn = os.getenv("DB_SECRET_ARN")
    
    if db_secret_arn:
        # --- Running in AWS: Fetch the secret ---
        print("DB_SECRET_ARN found, fetching credentials from AWS Secrets Manager...")
        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=os.getenv("AWS_REGION", "us-east-1"))
        
        try:
            get_secret_value_response = client.get_secret_value(SecretId=db_secret_arn)
            secret = json.loads(get_secret_value_response['SecretString'])
            
            username = secret['username']
            password = secret['password']
            host = os.getenv("DB_HOST") # We pass the host from CDK
            port = secret.get('port', 5432)
            dbname = secret.get('dbname', 'simdb')
            
            url = f"postgresql://{username}:{password}@{host}:{port}/{dbname}"
            print("Successfully constructed database URL from fetched secret.")
            return url
        except Exception as e:
            print(f"!!! FATAL: Could not fetch or parse DB secret from AWS: {e} !!!")
            raise e
    else:
        # --- Running Locally (docker-compose): Use default URL ---
        print("DB_SECRET_ARN not found, using default DATABASE_URL for local development.")
        return os.getenv("DATABASE_URL", "postgresql://user:password@sim-postgres/simdb")

DATABASE_URL = get_database_url()

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class SimulationJob(Base):
    __tablename__ = 'simulation_jobs'
    id = Column(String, primary_key=True, index=True)
    status = Column(String, default='QUEUED', index=True)
    progress = Column(String, default='0%')
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    results = relationship("SimulationResult", back_populates="job", cascade="all, delete-orphan")

class SimulationResult(Base):
    __tablename__ = 'simulation_results'
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey('simulation_jobs.id'), index=True)
    persona_id = Column(Integer, index=True)
    therapist_version = Column(String, index=True)
    evaluation_version = Column(String)
    transcript = Column(Text)
    evaluation = Column(JSON)
    run_at = Column(DateTime, default=datetime.utcnow)
    job = relationship("SimulationJob", back_populates="results")

def create_db_and_tables():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables verified/created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")