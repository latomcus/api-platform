var context = {
    api: [
		{
		    domain: 'user',
		    style: 'success',
		    operations: [
				{
				    title: 'user.create',
				    description: 'Create new user.',
				    dataIn: {
				        'action': 'user.create',
				        'params': {
				            'email': 'some_user@company.com',
				            'password': '1234567'
				        }
				    }
				},
				{
				    title: 'user.delete',
				    description: 'Delete existing user.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'user.delete',
				        'params': {
				            'email': 'some_user@company.com'
				        }
				    }
				},
				{
				    title: 'user.reset_password',
				    description: 'Reset user password.',
				    dataIn: {
				        'action': 'user.reset_password',
				        'params': {
				            'email': 'some_user@company.com'
				        }
				    }
				}
		    ]
		},
		{
		    domain: 'session',
		    style: 'info',
		    operations: [
				{
				    title: 'session.create',
				    description: 'Creates session and sets cookie.',
				    dataIn: {
						'action': 'session.create',
						'params': {
							'email': 'some_user@company.com',
							'password': '1234567'
						}
					}
				},
				{
				    title: 'session.is_valid',
				    description: 'Validate token.',
				    dataIn: {
				        'action': 'session.is_valid',
				        'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
				    }
				},
				{
				    title: 'session.delete',
				    description: 'Delete token.',
				    dataIn: {
				        'action': 'session.delete',
				        'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
				    }
				}
		    ]
		},
		{
		    domain: 'test',
		    style: 'warning',
		    operations: [
				{
				    title: 'hello world',
				    description: 'Sample execution of a function (non-database).',
				    dataIn: {
						'action': 'hello world',
						'params': {
							'some-data-in': 'very important data',
							'big-secret': '42'
						}
					}
				},
				{
				    title: 'cache.status',
				    description: 'Returns in-memory cache status.',
				    dataIn: {
				        'action': 'cache.status'
				    }
				},
				{
				    title: 'cache.add.test1',
				    description: 'Test adding item to cache for 1 minute, with absolute expiration, and cache key is action name.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'cache.add.test1'
				    }
				},
				{
				    title: 'cache.remove.test1',
				    description: 'Test removing item from cache by action name.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'cache.remove.test1'
				    }
				},
				{
				    title: 'cache.add.test2',
				    description: 'Test adding item to cache for 1 minute, with sliding expiration, and cache key is action name.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'cache.add.test2'
				    }
				},
				{
				    title: 'cache.remove.test2',
				    description: 'Test removing item from cache by action name.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'cache.remove.test2'
				    }
				},
				{
				    title: 'email.send.test1',
				    description: 'Test sending email.',
				    dataIn: {
						'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
				        'action': 'email.send.test1'
				    }
				},
				
		    ]
		},
    ]
};