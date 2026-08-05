from app.services.email_verification import hash_verification_token, new_verification_token


def test_verification_token_hash_stable():
    raw = "test-token-abc"
    assert hash_verification_token(raw) == hash_verification_token(raw)
    assert hash_verification_token(raw) != hash_verification_token(raw + "x")


def test_new_verification_token_tuple():
    raw, hashed, expires = new_verification_token()
    assert len(raw) > 20
    assert hashed == hash_verification_token(raw)
    assert expires > __import__("datetime").datetime.now(__import__("datetime").UTC)
