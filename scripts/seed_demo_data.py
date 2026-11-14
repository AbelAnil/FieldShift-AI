import os
import sys

# Ensure backend is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import SessionLocal, engine, Base
from app.models import User, Farm, Field, DataSource, EnvironmentalObservation, VegetationObservation, Crop
from app.core.security import get_password_hash
from app.utils.geo import validate_and_process_geojson
from app.services.crop_service import CropService


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Seed Crops database
        CropService.seed_crops_if_empty(db)
        # Seed Data Sources registry
        data_sources_list = [
            {
                "dataset_name": "NASA GPM IMERG v07",
                "provider": "NASA Precipitation Processing System (PPS)",
                "parameter": "Precipitation Rate, Daily & 7-day Cumulative Rainfall",
                "spatial_resolution": "0.1° (~10 km)",
                "temporal_resolution": "Daily / 30-minute late run",
                "source_url": "https://gpm.nasa.gov/data/imerg",
                "license": "NASA Open Data Policy (No cost)",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Multi-satellite gridded estimate. Captures convective rainfall patterns, but cannot replace physical local rain gauges.",
            },
            {
                "dataset_name": "NASA POWER Agroclimatology",
                "provider": "NASA Langley Research Center",
                "parameter": "T2M (Air Temp), Surface Solar Irradiance, Relative Humidity",
                "spatial_resolution": "0.5° x 0.5° gridded",
                "temporal_resolution": "Daily (~2-day latency)",
                "source_url": "https://power.larc.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Assimilation of GEOS models and satellite radiometers; representative of regional microclimate.",
            },
            {
                "dataset_name": "NASA SMAP L4 Global Enhanced",
                "provider": "NASA Jet Propulsion Laboratory (JPL)",
                "parameter": "Surface and Root-Zone Soil Moisture (m³/m³)",
                "spatial_resolution": "~9 km gridded",
                "temporal_resolution": "Daily",
                "source_url": "https://smap.jpl.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Coarse 9 km passive microwave footprint. Shows landscape-scale drying and wetting cycles; not an in-situ farm sensor.",
            },
            {
                "dataset_name": "Landsat 8/9 OLI-2 & Sentinel-2 MSI",
                "provider": "NASA / USGS & ESA Copernicus (Supplementary)",
                "parameter": "NDVI (Canopy Greenness), NDMI (Canopy Moisture Stress)",
                "spatial_resolution": "10 m (Sentinel-2) / 30 m (Landsat 8/9)",
                "temporal_resolution": "5 to 16 days",
                "source_url": "https://landsat.gsfc.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "mixed",
                "scientific_limitations": "Cloud-filtered optical surface reflectance. Indicates foliar vigor, not a definitive diagnosis of plant disease.",
            },
        ]

        for ds in data_sources_list:
            existing_ds = db.query(DataSource).filter(DataSource.dataset_name == ds["dataset_name"]).first()
            if not existing_ds:
                db.add(DataSource(**ds))
        db.commit()
        print("Seeded Earth Observation data sources registry.")
        # Check if demo farmer 1 already exists
        email1 = "thomas.kerala@fieldshift.ai"
        user1 = db.query(User).filter(User.email == email1).first()
        if not user1:
            user1 = User(
                email=email1,
                name="Thomas Anil (Kanjirappally Farm)",
                password_hash=get_password_hash("fieldshift2026"),
                role="farmer",
            )
            db.add(user1)
            db.commit()
            db.refresh(user1)
            print(f"Created demo user: {user1.name} ({user1.email})")
        else:
            print(f"Demo user exists: {user1.email}")

        # Check if demo farmer 2 exists (for multi-tenant isolation testing)
        email2 = "ananya.wayanad@fieldshift.ai"
        user2 = db.query(User).filter(User.email == email2).first()
        if not user2:
            user2 = User(
                email=email2,
                name="Ananya Nair (Wayanad High Ranges)",
                password_hash=get_password_hash("fieldshift2026"),
                role="farmer",
            )
            db.add(user2)
            db.commit()
            db.refresh(user2)
            print(f"Created demo user 2: {user2.name}")

        # Seed Farm 1: Kanjirappally Valley Farm (Banana & Cassava)
        farm1_existing = db.query(Farm).filter(Farm.user_id == user1.id).first()
        if not farm1_existing:
            # 1.85 ha polygon in Kanjirappally, Kerala (lat 9.554, lon 76.786)
            kanjirappally_polygon = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.7850, 9.5530],
                        [76.7875, 9.5532],
                        [76.7880, 9.5555],
                        [76.7855, 9.5558],
                        [76.7848, 9.5542],
                        [76.7850, 9.5530],
                    ]
                ],
            }
            cleaned, ha, acres, (lat, lon) = validate_and_process_geojson(kanjirappally_polygon)

            farm1 = Farm(
                user_id=user1.id,
                farm_name="Kanjirappally Valley Farm",
                location_name="Kanjirappally, Kottayam, Kerala",
                latitude=lat,
                longitude=lon,
                total_area_hectares=ha,
                total_area_acres=acres,
                current_crop="Robusta Banana",
                planting_date="2026-06-15",
                expected_harvest_date="2027-04-20",
                irrigation_available=True,
                farming_priorities="Soil Health & Moisture Retention",
            )
            farm1.boundary_geojson = cleaned
            db.add(farm1)
            db.commit()
            db.refresh(farm1)
            print(f"Created Farm 1: {farm1.farm_name} ({farm1.total_area_hectares} ha / {farm1.total_area_acres} acres)")

            # Add two field blocks to Farm 1
            field1_poly = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.7850, 9.5530],
                        [76.7875, 9.5532],
                        [76.7872, 9.5545],
                        [76.7850, 9.5543],
                        [76.7850, 9.5530],
                    ]
                ],
            }
            f1_clean, f1_ha, f1_ac, _ = validate_and_process_geojson(field1_poly)
            f1 = Field(
                farm_id=farm1.id,
                field_name="Block A (Terraced Banana)",
                area_hectares=f1_ha,
                area_acres=f1_ac,
                current_crop="Robusta Banana",
                planting_date="2026-06-15",
                expected_harvest_date="2027-04-20",
                irrigation_available=True,
                notes="Red lateritic loam, drip line installed.",
            )
            f1.boundary_geojson = f1_clean
            db.add(f1)

            field2_poly = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.7850, 9.5543],
                        [76.7872, 9.5545],
                        [76.7880, 9.5555],
                        [76.7855, 9.5558],
                        [76.7850, 9.5543],
                    ]
                ],
            }
            f2_clean, f2_ha, f2_ac, _ = validate_and_process_geojson(field2_poly)
            f2 = Field(
                farm_id=farm1.id,
                field_name="Block B (Intercropped Cassava)",
                area_hectares=f2_ha,
                area_acres=f2_ac,
                current_crop="Tapioca (Cassava)",
                planting_date="2026-08-01",
                expected_harvest_date="2027-05-30",
                irrigation_available=False,
                notes="Rainfed plot along southern gentle slope.",
            )
            f2.boundary_geojson = f2_clean
            db.add(f2)
            db.commit()
            print("Added 2 field blocks to Farm 1.")

        # Seed Farm 2 for Ananya (Wayanad)
        farm2_existing = db.query(Farm).filter(Farm.user_id == user2.id).first()
        if not farm2_existing:
            wayanad_polygon = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.1280, 11.6840],
                        [76.1310, 11.6845],
                        [76.1315, 11.6870],
                        [76.1285, 11.6865],
                        [76.1280, 11.6840],
                    ]
                ],
            }
            cleaned2, ha2, acres2, (lat2, lon2) = validate_and_process_geojson(wayanad_polygon)
            farm2 = Farm(
                user_id=user2.id,
                farm_name="Wayanad Highland Coffee & Spices",
                location_name="Meppadi, Wayanad, Kerala",
                latitude=lat2,
                longitude=lon2,
                total_area_hectares=ha2,
                total_area_acres=acres2,
                current_crop="Black Pepper & Ginger",
                planting_date="2026-05-10",
                expected_harvest_date="2027-02-15",
                irrigation_available=True,
                farming_priorities="Organic Certification & Soil Health",
            )
            farm2.boundary_geojson = cleaned2
            db.add(farm2)
            db.commit()
            print(f"Created Farm 2 for Ananya: {farm2.farm_name}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()

