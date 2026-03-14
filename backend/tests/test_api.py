from fastapi.testclient import TestClient

from app.main import app


def test_infer_document_success():
    client = TestClient(app)

    res = client.post('/infer', files={'file': ('receipt.png', b'fake-image-bytes', 'image/png')})
    assert res.status_code == 200
    payload = res.json()
    assert payload['filename'] == 'receipt.png'
    assert payload['content_type'] == 'image/png'
    assert payload['text']
    assert 0.55 <= payload['confidence'] <= 0.99


def test_reject_invalid_type():
    client = TestClient(app)

    res = client.post('/infer', files={'file': ('bad.txt', b'abc', 'text/plain')})
    assert res.status_code == 400
