import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
import requests
from flask import Flask, request

# --- Initialization ---
app = Flask(__name__)

# Load secrets from environment variables
# In Cloud Run, these are set during deployment or in the service configuration.
try:
    print("🔧 Initializing Firebase Admin SDK...")
    service_account_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    CLIPDROP_API_KEY = os.environ.get("CLIPDROP_API_KEY")
    STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET")

    if not all([service_account_json_str, CLIPDROP_API_KEY, STORAGE_BUCKET]):
        raise ValueError("One or more required environment variables are missing.")

    service_account_info = json.loads(service_account_json_str)
    cred = credentials.Certificate(service_account_info)
    
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {'storageBucket': STORAGE_BUCKET})

    db = firestore.client()
    bucket = storage.bucket()
    print("✅ Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"❌ FATAL ERROR: Could not initialize Firebase. Check environment variables. Details: {e}")
    # Exit if initialization fails, as the worker cannot function.
    # In a real Cloud Run environment, this would cause the instance to fail and restart.
    exit(1)


# --- Image Processing Functions ---

def update_status(doc_ref, status: str):
    """Updates the processing status in Firestore."""
    print(f"  -> Updating status to: {status}")
    doc_ref.update({'visuals.showcaseProcessingStatus': status})

def remove_background(image_bytes: bytes) -> bytes:
    """Calls the ClipDrop API to remove the background."""
    print("  -> Initiating background removal with ClipDrop...")
    response = requests.post('https://api.clipdrop.co/remove-background/v1',
      files={'image_file': ('image.png', image_bytes, 'image/png')},
      headers={'x-api-key': CLIPDROP_API_KEY}
    )
    response.raise_for_status() # Will raise an exception for non-2xx status codes
    print("  ✅ Background removed successfully.")
    return response.content

def upscale_image(image_bytes: bytes) -> bytes:
    """Calls the ClipDrop API for upscaling."""
    print("  -> Initiating upscaling with ClipDrop...")
    response = requests.post('https://api.clipdrop.co/super-resolution/v1',
      files={'image_file': ('image.png', image_bytes, 'image/png')},
      headers={'x-api-key': CLIPDROP_API_KEY}
    )
    response.raise_for_status()
    print("  ✅ Image upscaled successfully.")
    return response.content

# --- Main Worker Logic ---

@app.route('/', methods=['POST'])
def process_image_handler():
    """Main handler triggered by Cloud Pub/Sub push subscription from a GCS trigger."""
    envelope = request.get_json()
    if not envelope or 'message' not in envelope:
        print(f"❌ Bad Request: Invalid Pub/Sub message format: {envelope}")
        return "Bad Request: Invalid Pub/Sub message format", 400

    # Decode the Pub/Sub message
    pubsub_message = envelope['message']
    if 'data' in pubsub_message:
        # This is for Pub/Sub push subscriptions
        event_data = json.loads(base64.b64decode(pubsub_message['data']).decode('utf-8'))
        file_name = event_data['name']
        bucket_name = event_data['bucket']
    elif 'attributes' in pubsub_message:
         # This is for Eventarc triggers
        file_name = pubsub_message['attributes']['objectId']
        bucket_name = pubsub_message['attributes']['bucketId']
    else:
        print(f"❌ Bad Request: Unrecognized message format: {pubsub_message}")
        return "Bad Request: Unrecognized message format", 400
        
    print(f"🔥 Received job for file: {file_name} in bucket: {bucket_name}")

    if not file_name.startswith('raw-uploads/'):
        print(f"  -> Skipping file '{file_name}' as it's not in the 'raw-uploads/' directory.")
        return "File skipped", 200

    path_parts = file_name.split('/')
    if len(path_parts) < 4:
        print(f"  -> Skipping file '{file_name}' due to unexpected path structure.")
        return "File skipped", 200
        
    user_id = path_parts[1]
    character_id = path_parts[2]
    
    char_ref = db.collection('characters').doc(character_id)

    try:
        # Download the original image from GCS
        print(f"  -> Downloading {file_name} from bucket {bucket_name}...")
        source_blob = bucket.blob(file_name)
        image_bytes = source_blob.download_as_bytes()
        print(f"  ✅ Download complete ({len(image_bytes) / 1024:.2f} KB).")

        # --- Processing Pipeline ---
        update_status(char_ref, 'removing-background')
        no_bg_bytes = remove_background(image_bytes)
        
        update_status(char_ref, 'upscaling')
        upscaled_bytes = upscale_image(no_bg_bytes)
        
        update_status(char_ref, 'finalizing')
        # Here you could add more processing with Pillow if needed
        final_bytes = upscaled_bytes
        
        # Upload the final image
        final_filename = f"showcase_{character_id}.png"
        destination_blob_name = f"showcase-images/{user_id}/{character_id}/{final_filename}"
        
        blob = bucket.blob(destination_blob_name)
        print(f"  -> Uploading final image to: {destination_blob_name}")
        blob.upload_from_string(final_bytes, content_type='image/png')
        blob.make_public()
        final_url = blob.public_url
        print(f"  ✅ Upload complete. URL: {final_url}")
        
        # Update Firestore with the final result
        char_ref.update({
            'visuals.showcaseImageUrl': final_url,
            'visuals.isShowcaseProcessed': True,
            'visuals.showcaseProcessingStatus': 'complete'
        })
        print(f"🎉 Processing successful for character {character_id}!")
        
        # Clean up the original file
        print(f"  -> Deleting original file: {file_name}")
        source_blob.delete()
        print(f"  ✅ Original file deleted.")

        return "Processing complete", 200

    except Exception as e:
        print(f"🚨 ERROR processing {character_id}: {e}")
        # Mark job as failed in Firestore to stop retries and inform the user
        char_ref.update({'visuals.showcaseProcessingStatus': 'failed'})
        # Return an error status to indicate failure.
        # Cloud Run/Eventarc may retry based on this.
        return f"Error processing file: {e}", 500

if __name__ == "__main__":
    # This is for local development testing.
    # When deployed to Cloud Run, a production-grade WSGI server like Gunicorn is used.
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
