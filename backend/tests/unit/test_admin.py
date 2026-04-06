import uuid

from app.models.user import User
from app.core.security import hash_password, create_access_token


def _register_and_login(client, email='user@test.com', password='Password1!'):
    client.post('/auth/register', json={'email': email, 'password': password})
    res = client.post('/auth/login', json={'email': email, 'password': password})
    return res.json()['access_token']


def _make_admin(client, db_session, email='admin@test.com'):
    token = _register_and_login(client, email=email)
    db_session.query(User).filter(User.email == email).update({'is_admin': True})
    db_session.commit()
    return token


def test_non_admin_cannot_access_stats(client, db_session):
    token = _register_and_login(client)
    res = client.get('/admin/stats', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 403


def test_admin_gets_stats(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='regular@test.com')
    # Set regular user to pro
    db_session.query(User).filter(User.email == 'regular@test.com').update({'subscription_tier': 'pro'})
    db_session.commit()

    res = client.get('/admin/stats', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    data = res.json()
    assert data['total_users'] == 2
    assert data['pro_users'] == 1
    assert data['free_users'] == 1


def test_admin_list_users(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='a@test.com')
    _register_and_login(client, email='b@test.com')

    res = client.get('/admin/users', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    users = res.json()
    assert len(users) == 3  # admin + 2 users


def test_admin_list_users_search(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='alice@example.com')
    _register_and_login(client, email='bob@example.com')

    res = client.get('/admin/users?search=alice', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]['email'] == 'alice@example.com'


def test_admin_list_users_filter_tier(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='free1@test.com')
    _register_and_login(client, email='pro1@test.com')
    db_session.query(User).filter(User.email == 'pro1@test.com').update({'subscription_tier': 'pro'})
    db_session.commit()

    res = client.get('/admin/users?tier=pro', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]['subscription_tier'] == 'pro'


def test_admin_get_user_detail(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='detail@test.com')
    user = db_session.query(User).filter(User.email == 'detail@test.com').first()

    res = client.get(f'/admin/users/{user.id}', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    data = res.json()
    assert data['email'] == 'detail@test.com'
    assert 'workout_count' in data
    assert 'exercise_count' in data


def test_admin_update_user(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='update@test.com')
    user = db_session.query(User).filter(User.email == 'update@test.com').first()

    res = client.put(
        f'/admin/users/{user.id}',
        json={'subscription_tier': 'pro'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 200
    assert res.json()['subscription_tier'] == 'pro'


def test_admin_impersonate_user(client, db_session):
    token = _make_admin(client, db_session)
    _register_and_login(client, email='target@test.com')
    user = db_session.query(User).filter(User.email == 'target@test.com').first()

    res = client.post(
        f'/admin/users/{user.id}/impersonate',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 200
    data = res.json()
    assert 'access_token' in data
    assert data['impersonating'] == 'target@test.com'


def test_admin_get_nonexistent_user(client, db_session):
    token = _make_admin(client, db_session)
    fake_id = uuid.uuid4()
    res = client.get(f'/admin/users/{fake_id}', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 404
