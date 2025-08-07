import csv
import json
from collections import OrderedDict

CSV_PATH = "/Users/jfaulkner/code/github_repos/personal/dma_map_box_backup/dma-heatmap/src/components/dmamap/dma_mapping.csv"
JSON_PATH = "/Users/jfaulkner/code/github_repos/personal/dma_map_box_backup/dma-heatmap/src/components/dmamap/nielsengeo.json"


# Load GeoJSON
def load_geojson(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Write GeoJSON
def write_geojson(json_path, data):
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


# Load DMA mapping from CSV
def load_dma_mapping(csv_path):
    mapping = {}
    with open(csv_path, newline="", encoding="utf-8") as csvfile:
        for row in csv.DictReader(csvfile):
            dma_id = int(row["dma_number"])
            dma_name = row["dma_name"].strip()
            mapping[dma_id] = dma_name
    return mapping


# Update 'id' to 'dma_id' and ensure 'dma_id' and 'dma_name' are first
def update_feature_keys(geojson, dma_mapping):
    for feature in geojson.get("features", []):
        # Move 'id' to 'dma_id'
        if "id" in feature:
            feature["dma_id"] = feature.pop("id")
        dma_id = feature.get("dma_id")
        dma_name = dma_mapping.get(dma_id, "")
        feature["dma_name"] = dma_name
        # Reorder keys: dma_id, dma_name, then the rest
        ordered = OrderedDict()
        ordered["dma_id"] = feature["dma_id"]
        ordered["dma_name"] = feature["dma_name"]
        for k, v in feature.items():
            if k not in {"dma_id", "dma_name"}:
                ordered[k] = v
        feature.clear()
        feature.update(ordered)
    return geojson


def main():
    dma_mapping = load_dma_mapping(CSV_PATH)
    geojson = load_geojson(JSON_PATH)
    updated_geojson = update_feature_keys(geojson, dma_mapping)
    write_geojson(JSON_PATH, updated_geojson)
    print(
        f"Updated {JSON_PATH}: 'dma_id' and 'dma_name' are now the first keys in all features."
    )


if __name__ == "__main__":
    main()
