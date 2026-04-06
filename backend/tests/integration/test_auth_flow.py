def _register(client, email='auth@example.com', password='Password123!', name=None):
    payload = {'email': email, 'password': password}
    if name:
        payload['name'] = name
    res = client.post('/auth/register', json=payload)
    assert res.status_code == 201
    return res.json()


def _login(client, email='auth@example.com', password='Password123!'):
    res = client.post('/auth/login', json={'email': email, 'password': password})
    assert res.status_code == 200
    return res.json()


def _auth_headers(client, email='auth@example.com', password='Password123!'):
    _register(client, email=email, password=password)
    token = _login(client, email=email, password=password)['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_register_with_name(client):
    data = _register(client, name='Alice')
    assert data['name'] == 'Alice'
    assert data['subscription_tier'] == 'free'
    assert data['email_verified'] is False


def test_register_without_name(client):
    data = _register(client)
    assert data['name'] is None


def test_get_me_includes_new_fields(client):
    headers = _auth_headers(client)
    res = client.get('/auth/me', headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert 'subscription_tier' in data
    assert 'email_verified' in data
    assert data['subscription_tier'] == 'free'


def test_update_profile(client):
    headers = _auth_headers(client)
    res = client.put('/auth/profile', json={'name': 'Updated Name'}, headers=headers)
    assert res.status_code == 200
    assert res.json()['name'] == 'Updated Name'

    me = client.get('/auth/me', headers=headers)
    assert me.json()['name'] == 'Updated Name'


def test_change_password(client):
    headers = _auth_headers(client, email='chgpw@example.com')
    res = client.post(
        '/auth/change-password',
        json={'current_password': 'Password123!', 'new_password': 'NewPassword456!'},
        headers=headers,
    )
    assert res.status_code == 204

    # Old password should no longer work
    login_res = client.post('/auth/login', json={'email': 'chgpw@example.com', 'password': 'Password123!'})
    assert login_res.status_code == 401

    # New password should work
    login_res2 = client.post('/auth/login', json={'email': 'chgpw@example.com', 'password': 'NewPassword456!'})
    assert login_res2.status_code == 200


def test_change_password_wrong_current(client):
    headers = _auth_headers(client, email='chgpw2@example.com')
    res = client.post(
        '/auth/change-password',
        json={'current_password': 'WrongPassword!1', 'new_password': 'NewPassword456!'},
        headers=headers,
    )
    assert res.status_code == 400


def test_forgot_password_always_200(client):
    # Non-existent email should still return 200 (anti-enumeration)
    res = client.post('/auth/forgot-password', json={'email': 'nobody@example.com'})
    assert res.status_code == 200

    # Existing email should also return 200
    _register(client, email='forgot@example.com')
    res2 = client.post('/auth/forgot-password', json={'email': 'forgot@example.com'})
    assert res2.status_code == 200


def test_reset_password_invalid_token(client):
    res = client.post('/auth/reset-password', json={'token': 'bad-token', 'new_password': 'NewPassword456!'})
    assert res.status_code == 400


def test_verify_email_invalid_token(client):
    res = client.post('/auth/verify-email', json={'token': 'bad-token'})
    assert res.status_code == 400


def test_delete_account(client):
    headers = _auth_headers(client, email='delete@example.com')
    res = client.delete('/auth/account', headers=headers)
    assert res.status_code == 204

    # Login should fail after deletion
    login_res = client.post('/auth/login', json={'email': 'delete@example.com', 'password': 'Password123!'})
    assert login_res.status_code == 401


def test_resend_verification(client):
    headers = _auth_headers(client, email='resend@example.com')
    res = client.post('/auth/resend-verification', headers=headers)
    assert res.status_code == 200
