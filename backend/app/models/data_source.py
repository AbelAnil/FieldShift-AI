import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_name = Column(String(100), unique=True, nullable=False)
    provider = Column(String(100), nullable=False)  # NASA, ESA/Copernicus, ISRIC
    parameter = Column(String(255), nullable=False)
    spatial_resolution = Column(String(100), nullable=False)
    temporal_resolution = Column(String(100), nullable=False)
    source_url = Column(String(255), nullable=False)
    license = Column(String(100), default="Open Access", nullable=False)
    scientific_limitations = Column(Text, nullable=False)
    is_nasa_dataset = Column(String(10), default="true", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

