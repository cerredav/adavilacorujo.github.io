from fastapi.testclient import TestClient

from app import main
from app.models import ExtractedLineItem, ExtractedTax, StructuredExtraction


def test_infer_document_success():
    client = TestClient(main.app)

    main.extract_structured_fields = lambda *_args, **_kwargs: StructuredExtraction(  # type: ignore[assignment]
        vendor_name='Test Vendor',
        receipt_total=123.45,
        total_amount=123.45,
        taxes=[ExtractedTax(name='State Tax', amount=8.45, rate=0.07)],
        line_items=[ExtractedLineItem(description='Widget', qty=1, unit_price=115.00, total=115.00)],
    )

    res = client.post('/infer', files={'file': ('receipt.png', b'fake-image-bytes', 'image/png')})
    assert res.status_code == 200
    payload = res.json()
    assert payload['filename'] == 'receipt.png'
    assert payload['content_type'] == 'image/png'
    assert payload['text']
    assert 0.55 <= payload['confidence'] <= 0.99
    assert payload['structured']['vendor_name'] == 'Test Vendor'
    assert payload['structured']['receipt_total'] == 123.45
    assert payload['structured']['taxes'][0]['name'] == 'State Tax'
    assert payload['structured']['taxes'][0]['amount'] == 8.45
    assert payload['structured']['line_items'][0]['description'] == 'Widget'


def test_reject_invalid_type():
    client = TestClient(main.app)

    res = client.post('/infer', files={'file': ('bad.txt', b'abc', 'text/plain')})
    assert res.status_code == 400
