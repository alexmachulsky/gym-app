def _auth_headers(client, email='bill@example.com', password='Password123!'):
    client.post('/auth/register', json={'email': email, 'password': password})
    login = client.post('/auth/login', json={'email': email, 'password': password})
    token = login.json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_billing_config(client):
    res = client.get('/billing/config')
    assert res.status_code == 200
    data = res.json()
    assert 'publishable_key' in data
    assert 'pro_monthly_price_id' in data
    assert 'pro_yearly_price_id' in data


def test_billing_status_free_user(client):
    headers = _auth_headers(client)
    res = client.get('/billing/status', headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data['subscription_tier'] == 'free'
    assert data['plan'] is None


def test_checkout_invalid_plan(client):
    headers = _auth_headers(client, email='checkout@example.com')
    res = client.post('/billing/checkout', json={'plan': 'bad_plan'}, headers=headers)
    assert res.status_code == 400


def test_portal_no_customer(client):
    headers = _auth_headers(client, email='portal@example.com')
    res = client.post('/billing/portal', headers=headers)
    assert res.status_code == 400


def test_webhook_no_signature(client):
    res = client.post('/billing/webhook', content=b'{}', headers={'Content-Type': 'application/json'})
    assert res.status_code == 400
