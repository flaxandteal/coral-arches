import json
import re
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

exclude_strings = [
    r'ontology_id', 
    r'function_id', 
    r'template_id', 
    r'widget_id', 
    r'component_id', 
    r'conceptid', 
    r'config\.defaultValue',
    r'options\[\d+\]\.id',
    r'config\.rdmCollection',
    r'config\.graphid\[\d+\]',
    r'config\.graphs\[\d+\]\.graphid'
]


def in_string(patterns, string):
    return any(re.search(p, string) for p in patterns)


def is_valid_uuid(value):
    uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    return bool(re.match(uuid_pattern, value))


def traverse_json(data, uuid_store, parent_key=''):
    if isinstance(data, dict):
        for key, value in data.items():
            current_key = f'{parent_key}.{key}' if parent_key else key
            data[key] = traverse_json(value, uuid_store, current_key)  # Update the value in the dictionary
    elif isinstance(data, list):
        for index, item in enumerate(data):
            current_key = f'{parent_key}[{index}]'
            data[index] = traverse_json(item, uuid_store, current_key)  # Update the item in the list
    else:
        if is_valid_uuid(str(data)):
            # Certain UUIDs already exist as part of the app, they are excluded to prevent changing them
            if not in_string(exclude_strings, parent_key):
                if data in uuid_store:
                    # Replace the found UUID with the previously generated UUID for that key
                    new_uuid = uuid_store[data]
                    logger.info(f'Found UUID in {parent_key}: Before={data}, After={new_uuid}')
                    return new_uuid  # Return the new UUID to update the value in the JSON data
                else:
                    # Generate a new UUID and store it for the key
                    new_uuid = str(uuid.uuid4())
                    uuid_store[data] = new_uuid
                    logger.info(f'Generated new UUID in {parent_key}: {new_uuid}')
                    return new_uuid  # Return the new UUID to update the value in the JSON data
            else:
                logger.info(f'Excluded UUID was found and not updated: ' + parent_key)

    return data  # Return the original data structure back to update the value in the JSON data


if __name__ == '__main__':
    file_path = '../Excavation License.json.old'
    # output_file_path = '../Excavation License.json.new'
    output_file_path = 'coral/coral/pkg/graphs/resource_models/Excavation License.json'

    try:
        with open(file_path, 'r') as file:
            json_data = json.load(file)

        # logger.info('Original JSON data:')
        # logger.info(json.dumps(json_data, indent=2))

        uuid_store = {}  # Dictionary to store UUIDs for each key
        traverse_json(json_data, uuid_store)

        # logger.info('Updated JSON data:')
        # logger.info(json.dumps(json_data, indent=2))

        # Write the updated JSON data to a new file
        with open(output_file_path, 'w') as output_file:
            json.dump(json_data, output_file, indent=2)

        logger.info(f'Updated JSON data written to: {output_file_path}')

    except FileNotFoundError:
        print(f'File not found: {file_path}')
    except json.JSONDecodeError:
        print(f'Invalid JSON format in file: {file_path}')