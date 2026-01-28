"""
FIREBASE INTEGRATION SERVICE
Cloud Firestore for evidence storage and real-time sync
Project: echo-prime-ai
"""
import os
import json
from typing import Optional, Dict, List, Any
from datetime import datetime
from loguru import logger

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin not installed, cloud features disabled")


class FirebaseService:
    """
    Firebase integration for SHADOWGLASS
    - Firestore for assessment/finding data
    - Cloud Storage for evidence files
    - Real-time sync for multi-device access
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.db = None
        self.bucket = None
        self.project_id = os.getenv("FIREBASE_PROJECT_ID", "echo-prime-ai")

        if FIREBASE_AVAILABLE:
            self._initialize_firebase()

        self._initialized = True

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            try:
                firebase_admin.get_app()
                logger.info("Firebase already initialized")
            except ValueError:
                # Initialize with default credentials or service account
                cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': f'{self.project_id}.appspot.com'
                    })
                else:
                    # Use default credentials (ADC)
                    firebase_admin.initialize_app(options={
                        'projectId': self.project_id,
                        'storageBucket': f'{self.project_id}.appspot.com'
                    })

                logger.info(f"Firebase initialized for project: {self.project_id}")

            self.db = firestore.client()
            self.bucket = storage.bucket()

        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            self.db = None
            self.bucket = None

    @property
    def is_available(self) -> bool:
        """Check if Firebase is available"""
        return FIREBASE_AVAILABLE and self.db is not None

    # ==================== ASSESSMENTS ====================

    async def sync_assessment(self, assessment: Dict[str, Any]) -> bool:
        """Sync assessment to Firestore"""
        if not self.is_available:
            return False

        try:
            doc_ref = self.db.collection('shadowglass_assessments').document(assessment['id'])
            doc_ref.set({
                **assessment,
                'synced_at': datetime.utcnow().isoformat(),
                'source': 'shadowglass_api'
            }, merge=True)
            logger.info(f"Assessment {assessment['id']} synced to Firebase")
            return True
        except Exception as e:
            logger.error(f"Failed to sync assessment: {e}")
            return False

    async def get_cloud_assessments(self, user_id: str) -> List[Dict[str, Any]]:
        """Get assessments from cloud for user"""
        if not self.is_available:
            return []

        try:
            docs = self.db.collection('shadowglass_assessments')\
                .where('created_by', '==', user_id)\
                .order_by('created_at', direction=firestore.Query.DESCENDING)\
                .limit(100)\
                .stream()

            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Failed to get cloud assessments: {e}")
            return []

    # ==================== FINDINGS ====================

    async def sync_finding(self, finding: Dict[str, Any]) -> bool:
        """Sync finding to Firestore"""
        if not self.is_available:
            return False

        try:
            doc_ref = self.db.collection('shadowglass_findings').document(finding['id'])
            doc_ref.set({
                **finding,
                'synced_at': datetime.utcnow().isoformat(),
                'source': 'shadowglass_api'
            }, merge=True)
            logger.info(f"Finding {finding['id']} synced to Firebase")
            return True
        except Exception as e:
            logger.error(f"Failed to sync finding: {e}")
            return False

    async def get_findings_by_severity(self, severity: str) -> List[Dict[str, Any]]:
        """Get all findings of a specific severity"""
        if not self.is_available:
            return []

        try:
            docs = self.db.collection('shadowglass_findings')\
                .where('severity', '==', severity)\
                .order_by('created_at', direction=firestore.Query.DESCENDING)\
                .stream()

            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Failed to get findings by severity: {e}")
            return []

    # ==================== EVIDENCE ====================

    async def upload_evidence(
        self,
        evidence_id: str,
        file_data: bytes,
        file_name: str,
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """Upload evidence file to Cloud Storage"""
        if not self.is_available or not self.bucket:
            return None

        try:
            blob_path = f"shadowglass/evidence/{evidence_id}/{file_name}"
            blob = self.bucket.blob(blob_path)
            blob.upload_from_string(file_data, content_type=content_type)

            # Make URL valid for 7 days
            url = blob.generate_signed_url(
                version="v4",
                expiration=60 * 60 * 24 * 7,  # 7 days
                method="GET"
            )

            logger.info(f"Evidence uploaded: {blob_path}")
            return url
        except Exception as e:
            logger.error(f"Failed to upload evidence: {e}")
            return None

    async def get_evidence_url(self, evidence_id: str, file_name: str) -> Optional[str]:
        """Get signed URL for evidence file"""
        if not self.is_available or not self.bucket:
            return None

        try:
            blob_path = f"shadowglass/evidence/{evidence_id}/{file_name}"
            blob = self.bucket.blob(blob_path)

            if not blob.exists():
                return None

            url = blob.generate_signed_url(
                version="v4",
                expiration=60 * 60,  # 1 hour
                method="GET"
            )
            return url
        except Exception as e:
            logger.error(f"Failed to get evidence URL: {e}")
            return None

    # ==================== TARGETS ====================

    async def sync_target(self, target: Dict[str, Any]) -> bool:
        """Sync target to Firestore"""
        if not self.is_available:
            return False

        try:
            doc_ref = self.db.collection('shadowglass_targets').document(target['id'])
            doc_ref.set({
                **target,
                'synced_at': datetime.utcnow().isoformat()
            }, merge=True)
            return True
        except Exception as e:
            logger.error(f"Failed to sync target: {e}")
            return False

    # ==================== ANALYTICS ====================

    async def log_scan_activity(
        self,
        assessment_id: str,
        scan_type: str,
        target: str,
        result_summary: Dict[str, Any]
    ) -> bool:
        """Log scan activity for analytics"""
        if not self.is_available:
            return False

        try:
            self.db.collection('shadowglass_activity').add({
                'assessment_id': assessment_id,
                'scan_type': scan_type,
                'target': target,
                'result_summary': result_summary,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'shadowglass_api'
            })
            return True
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
            return False

    async def get_scan_statistics(self, assessment_id: str) -> Dict[str, Any]:
        """Get scan statistics for assessment"""
        if not self.is_available:
            return {}

        try:
            docs = self.db.collection('shadowglass_activity')\
                .where('assessment_id', '==', assessment_id)\
                .stream()

            stats = {
                'total_scans': 0,
                'scan_types': {},
                'targets_scanned': set()
            }

            for doc in docs:
                data = doc.to_dict()
                stats['total_scans'] += 1
                scan_type = data.get('scan_type', 'unknown')
                stats['scan_types'][scan_type] = stats['scan_types'].get(scan_type, 0) + 1
                stats['targets_scanned'].add(data.get('target', ''))

            stats['targets_scanned'] = len(stats['targets_scanned'])
            return stats
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return {}


# Singleton instance
_firebase_service: Optional[FirebaseService] = None


def get_firebase_service() -> FirebaseService:
    """Get Firebase service singleton"""
    global _firebase_service
    if _firebase_service is None:
        _firebase_service = FirebaseService()
    return _firebase_service
