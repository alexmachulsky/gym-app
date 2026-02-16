def _register_and_login(client, email='flow@example.com', password='Password123!'):
    register_res = client.post('/auth/register', json={'email': email, 'password': password})
    assert register_res.status_code == 201

    login_res = client.post('/auth/login', json={'email': email, 'password': password})
    assert login_res.status_code == 200
    token = login_res.json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_workout_creation_flow(client):
    headers = _register_and_login(client)

    create_exercise = client.post('/exercises', json={'name': 'Bench Press'}, headers=headers)
    assert create_exercise.status_code == 201
    exercise_id = create_exercise.json()['id']

    workout_payload = {
        'date': '2026-02-01',
        'sets': [
            {'exercise_id': exercise_id, 'weight': 100, 'reps': 5, 'sets': 3},
            {'exercise_id': exercise_id, 'weight': 90, 'reps': 8, 'sets': 2},
        ],
    }
    create_workout = client.post('/workouts', json=workout_payload, headers=headers)
    assert create_workout.status_code == 201
    workout_data = create_workout.json()
    assert workout_data['date'] == '2026-02-01'
    assert len(workout_data['sets']) == 2

    list_workouts = client.get('/workouts', headers=headers)
    assert list_workouts.status_code == 200
    listed = list_workouts.json()
    assert len(listed) == 1
    assert listed[0]['id'] == workout_data['id']


def test_workout_history_is_user_scoped(client):
    headers_user1 = _register_and_login(client, email='u1@example.com')
    headers_user2 = _register_and_login(client, email='u2@example.com')

    ex1 = client.post('/exercises', json={'name': 'Deadlift'}, headers=headers_user1)
    assert ex1.status_code == 201

    create_w1 = client.post(
        '/workouts',
        json={
            'date': '2026-02-02',
            'sets': [
                {
                    'exercise_id': ex1.json()['id'],
                    'weight': 140,
                    'reps': 5,
                    'sets': 3,
                }
            ],
        },
        headers=headers_user1,
    )
    assert create_w1.status_code == 201

    list_user2 = client.get('/workouts', headers=headers_user2)
    assert list_user2.status_code == 200
    assert list_user2.json() == []
