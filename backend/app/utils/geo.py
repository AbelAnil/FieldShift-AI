import math
from typing import Any, Dict, List, Tuple
from shapely.geometry import shape, mapping
from shapely.validation import explain_validity


def calculate_geodesic_polygon_area_sq_meters(coordinates: List[List[float]]) -> float:
    """
    Calculate the geodesic surface area of a spherical polygon in square meters
    given WGS84 coordinates [[lon, lat], ...].
    Uses spherical excess formula with Earth mean authalic radius.
    """
    if len(coordinates) < 4:
        return 0.0

    # Ensure closed polygon
    if coordinates[0] != coordinates[-1]:
        coordinates.append(coordinates[0])

    R = 6378137.0  # WGS84 semi-major axis in meters
    area = 0.0

    for i in range(len(coordinates) - 1):
        p1 = coordinates[i]
        p2 = coordinates[i + 1]

        lon1 = math.radians(p1[0])
        lat1 = math.radians(p1[1])
        lon2 = math.radians(p2[0])
        lat2 = math.radians(p2[1])

        area += (lon2 - lon1) * (2 + math.sin(lat1) + math.sin(lat2))

    area = abs(area * R * R / 2.0)
    return area


def validate_and_process_geojson(geojson_data: Dict[str, Any]) -> Tuple[Dict[str, Any], float, float, Tuple[float, float]]:
    """
    Validates a GeoJSON geometry or Feature, repairs simple issues, computes:
    - cleaned GeoJSON dict (EPSG:4326)
    - area in hectares
    - area in acres
    - centroid (lat, lon)
    """
    # If a FeatureCollection or Feature is passed, extract geometry
    if geojson_data.get("type") == "FeatureCollection":
        features = geojson_data.get("features", [])
        if not features:
            raise ValueError("FeatureCollection contains no features.")
        geom_dict = features[0].get("geometry")
    elif geojson_data.get("type") == "Feature":
        geom_dict = geojson_data.get("geometry")
    else:
        geom_dict = geojson_data

    if not geom_dict:
        raise ValueError("No geometry found in GeoJSON payload.")

    geom_type = geom_dict.get("type")
    if geom_type not in ["Polygon", "MultiPolygon"]:
        raise ValueError(f"Geometry type must be Polygon or MultiPolygon, got '{geom_type}'.")

    # Validate with Shapely
    try:
        geom_obj = shape(geom_dict)
    except Exception as e:
        raise ValueError(f"Invalid GeoJSON geometry structure: {str(e)}")

    if not geom_obj.is_valid:
        # Try to fix invalid polygon with buffer(0)
        geom_obj = geom_obj.buffer(0)
        if not geom_obj.is_valid:
            reason = explain_validity(geom_obj)
            raise ValueError(f"Invalid polygon geometry: {reason}")

    # Compute area
    total_area_sqm = 0.0
    if geom_type == "Polygon":
        rings = geom_dict.get("coordinates", [])
        if rings:
            # Outer boundary
            total_area_sqm += calculate_geodesic_polygon_area_sq_meters(rings[0])
            # Subtract interior rings (holes)
            for inner_ring in rings[1:]:
                total_area_sqm -= calculate_geodesic_polygon_area_sq_meters(inner_ring)
    elif geom_type == "MultiPolygon":
        for poly_coords in geom_dict.get("coordinates", []):
            if poly_coords:
                total_area_sqm += calculate_geodesic_polygon_area_sq_meters(poly_coords[0])
                for inner_ring in poly_coords[1:]:
                    total_area_sqm -= calculate_geodesic_polygon_area_sq_meters(inner_ring)

    total_area_sqm = max(total_area_sqm, 0.0)
    area_hectares = round(total_area_sqm / 10000.0, 4)
    area_acres = round(area_hectares * 2.47105, 4)

    # Compute centroid
    centroid = geom_obj.centroid
    centroid_coords = (round(centroid.y, 6), round(centroid.x, 6))  # (lat, lon)

    # Validate coordinate range
    if not (-90.0 <= centroid_coords[0] <= 90.0 and -180.0 <= centroid_coords[1] <= 180.0):
        raise ValueError("Coordinates are out of WGS84 geographical bounds [-180, 180], [-90, 90].")

    return mapping(geom_obj), area_hectares, area_acres, centroid_coords
