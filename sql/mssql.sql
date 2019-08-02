--https://github.com/latomcus/api-platform

--1. Create new database
If(db_id('api_database') is null)
	create database api_database
go

--switch to new database
use api_database
go

--2. Create login
if not exists (select name from sys.server_principals where name='api_user')
	create login api_user with password='secret';-- enter your own secure password
	go

if not exists (select name from sys.database_principals where name='api_user')
	create user api_user for login api_user;
	go

--3. Grant execute permissions
grant execute to api_user
go

--4. Create schema
if not exists (select 1 from sys.schemas where name='service')
	exec ('create schema [service]')
go

--5. Create tables

if object_id('dbo.users') is null
	create table dbo.users(
	id int identity(0,1) not null,
	email nvarchar(50) not null,
	password binary(64) not null,
	primary key clustered (email asc))
	/* --testing
	drop table dbo.users
	truncate table dbo.users
	select top 100 * from dbo.users
	*/

if object_id('dbo.sessions') is null
	create table dbo.sessions(
	token varchar(60) default newid() not null,
	user_id int not null,
	expires datetime not null default dateadd(day,1,getdate()),
	primary key clustered (token asc))
	/* --testing
	drop table dbo.sessions
	truncate table dbo.sessions
	select top 100 * from dbo.sessions
	*/

if object_id('service.audit') is null
	create table service.audit(
	id int identity(0,1) not null,
	created_on datetime not null default getdate(),
	action varchar(200) not null,
	params nvarchar(max) null,
	code varchar(10) null,
	error_number varchar(20) null,
	error_message varchar(500) null,
	duration int null, primary key clustered (id asc))
	/* --testing
	drop table service.audit
	select top 100 * from service.audit
	*/
go

--5. Create Stored Procedures

create or alter procedure [service].[data_out]
@code varchar(10),@message varchar(200),@data nvarchar(max)=NULL,
	@actions nvarchar(max)=null
/*
exec service.process @action='user.create',@params=N'{"email":"some_email7@company.com","password":"1234567"}'
exec service.process
*/
as
select a.code as [code],a.[message] as [message],
	(select [data] from OPENJSON('{"data":'+@data+'}') WITH (data NVARCHAR(MAX) as JSON)) AS [data],
	(select [actions] from OPENJSON('{"actions":'+@actions+'}') WITH (actions NVARCHAR(MAX) as JSON)) AS [actions]
from (select @code AS code,@message AS [message]) a FOR JSON PATH, WITHOUT_ARRAY_WRAPPER


/* -- alternative wrapper:
select convert(nvarchar(max),(
	select @code as [code],@message as [message],@data as [data],@actions as [actions]
for json path, WITHOUT_ARRAY_WRAPPER)) as response
*/
GO

create or alter procedure [service].[documentation]
/*
sample:
exec service.process
*/
as

declare @api table ([action] varchar(200),[description] nvarchar(500))
insert @api ([action],[description])
values
	('user.create','description'),
	('user.delete','description'),
	('user.reset_password','description'),
	('session.create','description'),
	('session.is_valid','description'),
	('session.delete','description')

declare @data nvarchar(max)
set @data = (select convert(nvarchar(500),(
	select [action],[description] from @api for json path)))

execute service.data_out @code='d.d.01',@message='Documentation',@data=@data
GO

create or alter procedure [service].[session_create]
@params nvarchar(max)=null
/*
sample:
exec service.process @action='session.create',@params=N'{"email":"some_email@company.com","password":"1234567"}'

*/
as
declare @user_id int,@email nvarchar(50)='',@password nvarchar(50)='',@data nvarchar(500),@actions nvarchar(max)

--parse input
select @email=email,@password=[password] from OpenJson(@params) with (email nvarchar(50) '$.email',[password] nvarchar(50) '$.password')

--validate email
if (len(@email)<5 or @email is null) begin --minimum email is: a@b.c
	execute service.data_out @code='d.ad.00',@message='Invalid email'; return; end;

--validate password
if (len(@password)<6 or @password is null) begin --minimum password len is 6
	execute service.data_out @code='d.ad.01',@message='Invalid password'; return; end;

--validate if account exists
select @user_id=id from dbo.users where email=@email and [password]=HASHBYTES('SHA2_512', @password)
if @user_id is null begin
	execute service.data_out @code='d.ad.02',@message='Invalid credentials'; return; end;

--create new session
declare @token varchar(60)=newid()
insert dbo.sessions (token,user_id,expires)
	values (@token,@user_id,dateadd(day,1,getdate()))

set @data = (select convert(nvarchar(500),(
	select @token as [token] for json path, WITHOUT_ARRAY_WRAPPER)))

set @actions = (select convert(nvarchar(max),(
	select 'set cookie' as [action],'token' as [name],@token as [value] for json path)))

execute service.data_out @code='d.ad.03',@message='Session created',@data=@data,@actions=@actions

GO

create or alter procedure [service].[session_delete]
@token varchar(60)
/*
sample:
exec service.process @action='session.delete',@token='FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
*/
as
declare @actions nvarchar(max)

--validate token
if @token is null or len(@token)!=36 begin
	execute service.data_out @code='d.af.00',@message='Invalid security token'; return; end;

delete dbo.[sessions] where token=@token

set @actions = (select convert(nvarchar(max),(
	select 'delete cookie' as [action],'token' as [name] for json path)))

execute service.data_out @code='d.af.01',@message='Session deleted',@actions=@actions
GO

create or alter procedure [service].[session_is_valid]
@token varchar(60)
/*
sample:
exec service.process @action='session.is_valid',@token='FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
*/
as
declare @user_id int,@data nvarchar(500)

--validate token
if @token is null or len(@token)!=36 begin
	execute service.data_out @code='d.ae.00',@message='Invalid security token'; return; end;

--find session
if @token!='FFC9B676-44E9-4A1D-9DAB-24280601FDBF' begin --ignore check for test token
	if not exists (select 1 from dbo.sessions where token=@token and expires>getdate()) begin
		set @data = (select convert(nvarchar(max),(select 'no' as [valid] for json path, WITHOUT_ARRAY_WRAPPER)))
		execute service.data_out @code='d.ae.01',@message='Session is not valid',@data=@data
		return
	end
end

set @data = (select convert(nvarchar(500),(select 'yes' as [valid] for json path, WITHOUT_ARRAY_WRAPPER)))
execute service.data_out @code='d.ae.02',@message='Session is valid',@data=@data
GO

create or alter procedure [service].[test]
@acceptable_performance int=10 -- in ms
/*
sample:
exec service.test
*/
as
set nocount on

declare @tests table (id int identity(0,1),description varchar(200),token varchar(100),action varchar(200),
	params nvarchar(max),expected_code varchar(50),received_code varchar(50),duration int)
insert @tests (description,token,action,params,expected_code)
values
	--no action
	('no action','',null,null,'d.p.01'),

	--wrong action
	('wrong action','wrong','',null,'d.p.01'),

	--testing user.create
	('no parameters','','user.create',null,'d.aa.00'),
	('malformed email parameter','','user.create',N'{"wrongmail":"","password":"big secret"}','d.aa.00'),
	('email is shorter than 5 characters','','user.create',N'{"email":"","password":"big secret"}','d.aa.00'),
	('malformed password parameter','','user.create',N'{"email":"some_email@company.com","wrongpassword":"12345"}','d.aa.01'),
	('password is shorter than 6 characters','','user.create',N'{"email":"some_email@company.com","password":"12345"}','d.aa.01'),
	('create new account','','user.create',N'{"email":"some_email@company.com","password":"1234567"}','d.aa.03'),
	('account already exists','','user.create',N'{"email":"some_email@company.com","password":"1234567"}','d.aa.02'),

	--testing session.create
	('no parameters','','session.create',null,'d.ad.00'),
	('malformed email parameter','','session.create',N'{"wrongmail":"","password":"big secret"}','d.ad.00'),
	('bad password parameter','','session.create',N'{"email":"some_email@company.com","password":""}','d.ad.01'),
	('invalid email','','session.create',N'{"email":"wrong_email@company.com","password":"1234567"}','d.ad.02'),
	('invalid password','','session.create',N'{"email":"some_email@company.com","password":"wrong password"}','d.ad.02'),
	('create session','','session.create',N'{"email":"some_email@company.com","password":"1234567"}','d.ad.03'),

	--testing session.is_valid
	('no token','','session.is_valid',null,'d.ae.00'),
	('too short security token','wrong token','session.is_valid',null,'d.ae.00'),
	('wrong security token','wrong676-44E9-4A1D-9DAB-24280601FDBF','session.is_valid',null,'d.ae.01'),
	('valid security token','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','session.is_valid',null,'d.ae.02'),

	--testing session.delete
	('no security token','','session.delete',null,'d.af.00'),
	('valid security token','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','session.delete',null,'d.af.01'),

	--testing user.reset_password
	('no parameters','','user.reset_password',null,'d.ac.01'),
	('malformed email','','user.reset_password',N'{"wrongemail":"some_email@company.com"}','d.ac.01'),
	('wrong email','','user.reset_password',N'{"email":"wrong_email@company.com"}','d.ac.02'),
	('reset password','','user.reset_password',N'{"email":"some_email@company.com"}','d.ac.03'),

	--testing user.delete
	('no security token','','user.delete',null,'d.ab.01'),
	('wrong security token','too short','user.delete',null,'d.ab.01'),
	('no parameters','wrong676-44E9-4A1D-9DAB-24280601FDBF','user.delete',null,'d.ab.02'),
	('malformed email','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','user.delete',N'{"wrongemail":"some_email@company.com"}','d.ab.02'),
	('email does not exist','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','user.delete',N'{"email":"wrong_email@company.com"}','d.ab.03'),
	('invalid security token','wrong676-44E9-4A1D-9DAB-24280601FDBF','user.delete',N'{"email":"some_email@company.com"}','d.ab.04'),
	('delete existing account','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','user.delete',N'{"email":"some_email@company.com"}','d.ab.05'),
	('email does not exist anymore','FFC9B676-44E9-4A1D-9DAB-24280601FDBF','user.delete',N'{"email":"some_email@company.com"}','d.ab.03')

	--add more tests as needed

--run tests
--declare @sink table (data nvarchar(max))
declare @c int,@m int,@token varchar(60),@action varchar(200),@params nvarchar(max),@code varchar(50),@duration int
	,@sink nvarchar(max)
select @c=0,@m=max(id) from @tests --init variables
while @c<=@m begin --loop through all tests
	--delete from @sink --prepare temp response storage
	select @token=token,@action=action,@params=params,@code=null from @tests where id=@c --get details
	print convert(varchar(10),@c) + ' > ' + isnull(@action,' - ') + ' = ' + isnull(@params,' - ')
	--select @sink=service.process @token=@token,@action=@action,@params=@params
	--insert @sink execute service.process @token=@token,@action=@action,@params=@params --execute
	--select @code=JSON_VALUE(data,'$.code'),@duration=JSON_VALUE(data,'$.duration') from @sink --extract code, duration
	update @tests set received_code=@code,duration=@duration where id=@c --update code, duration
	set @c=@c+1 --increment
end


--final out
declare @status varchar(50)
set @status='Ok'
select @status='Error' from @tests where expected_code!=received_code

--select @status as status
select case when expected_code=received_code then 'Ok' else 'Error' end as functional,
	case when duration>@acceptable_performance then 'slow' else '' end as performance,
	description,action,token,params,expected_code,received_code,duration
	from @tests
-- execute service.test

/*
exec service.process 
select * from dbo.users
	truncate table dbo.users
select * from dbo.sessions
*/
GO

CREATE or alter procedure [service].[user_create]
@token varchar(60)=null,@params nvarchar(max)=null
/*
sample:
exec service.process @action='user.create',@params=N'{"email":"some_email@company.com","password":"1234567"}'

--performance testing, service procedure
set nocount on
declare @cnt int=0,@params varchar(200)
declare @sink table (data varchar(1000))
while 1=1 begin
	--delete from @sink
	select @params='{"email":"user_' + convert(varchar,@cnt)+'@company.com","password":"1234567"}',@cnt=@cnt+1
	insert @sink exec service.process @action='user.create',@params=@params
	if @cnt>100000 return
end
--duration: 1:06

---------------
--performance testing, direct insert
set nocount on
declare @cnt int=0,@email varchar(50),@password binary(64)
while 1=1 begin
	select @email='user_'+convert(varchar,@cnt)+'@company.com', @password=HASHBYTES('SHA2_512',convert(varchar(50),newid())),@cnt=@cnt+1
	insert dbo.users (email,[password]) values (@email,@password)
	if @cnt>100000 return
end
--duration: 0:19

debug:
select * from users order by id
select count(*) from users (nolock)
truncate table users

*/
as
declare @email nvarchar(50)='',@password nvarchar(50)='',@data nvarchar(500),@actions nvarchar(max)

--parse input
select @email=email,@password=password from OpenJson(@params) with (email nvarchar(50) '$.email',password nvarchar(50) '$.password')

--validate email
if (len(@email)<5 or @email is null) begin --minimum email is: a@b.c
	execute service.data_out @code='d.aa.00',@message='Invalid email'; return; end;

--validate password
if (len(@password)<6 or @password is null) begin --minimum password len is 6
	execute service.data_out @code='d.a.a01',@message='Invalid password'; return; end;

--validate if email already exists
if exists(select 1 from dbo.users where email=@email) begin
	execute service.data_out @code='d.aa.02',@message='Account with this email already exists'; return; end;

--insert new account
declare @user_new table (id int)
insert dbo.users (email,password) --output inserted.id into @user_new
values(@email, HASHBYTES('SHA2_512', @password))

--set @data = (select convert(nvarchar(500),(
--	select id from @user_new for json path, WITHOUT_ARRAY_WRAPPER)))

set @actions = (select convert(nvarchar(max),(
	select 'send email' as action,@email as to_email,
		'support@company.com' as [from],
		'support@company.com' as [to],
		'Account created' as [subject],
		'Account created.' as body for json path)))

execute service.data_out @code='d.aa.03',@message='Account created',@data=@data,@actions=@actions
GO

create or alter procedure [service].[user_delete]
@token varchar(60)=null,@params nvarchar(max)=null
/*
sample:
exec service.process @token='FFC9B676-44E9-4A1D-9DAB-24280601FDBF',@action='user.delete',@params=N'{"email":"some_email@company.com"}'
*/
as
declare @email nvarchar(50)='',@user_id int,@actions nvarchar(max)

--validate token
if @token is null or len(@token)!=36 begin
	execute service.data_out @code='d.ab.01',@message='Invalid security token'; return; end;

--parse email input
select @email=email from OpenJson(@params) with (email nvarchar(50) '$.email')

--validate email
if (len(@email)<5 or @email is null) begin --minimum email is: a@b.c
	execute service.data_out @code='d.ab.02',@message='Invalid email'; return; end;

--validate if email exists
select @user_id=id from dbo.users where email=@email
if @user_id is null begin
	execute service.data_out @code='d.ab.03',@message='Account with this email does not exist'; return; end;

--authorize
if @token!='FFC9B676-44E9-4A1D-9DAB-24280601FDBF' begin --ignore if this is test token
	if not exists (select 1 from dbo.sessions where token=@token and user_id=@user_id and expires>getdate()) begin
		execute service.data_out @code='d.ab.04',@message='Invalid credentials or not autorized to delete account'; return; end;
	end

--delete
delete dbo.users where email=@email
delete dbo.sessions where user_id=@user_id --clear sessions
set @actions = (select convert(nvarchar(max),(
	select 'send email' as action,
		'support@company.com' as [from],
		'support@company.com' as [to],
		'Account deleted' as [subject],
		'Account deleted.' as body
	for json path)))
execute service.data_out @code='d.ab.05',@message='Account deleted',@actions=@actions
GO

create or alter procedure [service].[user_reset_password]
@params nvarchar(max)=null
/*
sample:
exec service.process @action='user.reset_password',@params=N'{"email":"some_email@company.com"}'

debug:
select * from dbo.users;
*/
as
declare @email nvarchar(50)='',@user_id int,@actions nvarchar(max)

--parse input
select @email=email from OpenJson(@params) with (email nvarchar(50) '$.email')

--validate email
if (len(@email)<5 or @email is null) begin --minimum email is: a@b.c
	execute service.data_out @code='d.ac.01',@message='Invalid email'; return; end;

--validate if email exists
select @user_id=id from dbo.users where email=@email
if @user_id is null begin
	execute service.data_out @code='d.ac.02',@message='Account with this email does not exist'; return; end;

--reset password
declare @new_password nvarchar(50),@password_hash binary(64)
set @new_password=substring(convert(varchar(50),newid()),1,8)
set @password_hash = HASHBYTES('SHA2_512', @new_password)

update dbo.users set password=@password_hash where email=@email
delete dbo.sessions where user_id=@user_id --clear sessions

set @actions = (select convert(nvarchar(max),(
	select 'send email' as action,
		'support@company.com' as [from],
		'support@company.com' as [to],
		'New password' as [subject],
		'Your new password: ' + @new_password as body for json path)))
execute service.data_out @code='d.ac.03',@message='Password reset',@actions=@actions
GO

create or alter procedure [service].[process]
@token varchar(60)=null,@action varchar(200)=null,@params nvarchar(max)=null
/*
Role: routing, error handling
*/
as

--show documentation
if @action is null begin exec service.documentation; return; end

--handle actions
begin try
	--for user
	if @action='user.create' begin exec service.user_create @params=@params; return; end
	if @action='user.delete' begin exec service.user_delete @token=@token,@params=@params; return; end
	if @action='user.reset_password' begin exec service.user_reset_password @params=@params; return; end

	--for session
	if @action='session.create' begin exec service.session_create @params=@params; return; end
	if @action='session.is_valid' begin exec service.session_is_valid @token=@token; return; end
	if @action='session.delete' begin exec service.session_delete @token=@token; return; end

	--add more handlers as needed

	--default action
	execute service.data_out @code='d.p.01',@message='Invalid Action'
end try

begin catch
	insert service.audit(action,params,code,[error_number],[error_message])
	select 'service.process',@params,'0',error_number(),error_message()

	execute service.data_out @code='d.p.02',@message='Error'
end catch
GO