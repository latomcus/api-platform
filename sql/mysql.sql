-- https://github.com/latomcus/api-platform

-- 1. Create database
create database api_database;
-- select version(); -- "8.0.15"

-- 2. After database is created you need to establish new connection and continue the steps below
use api_database;

-- 3. Create sample tables
create table if not exists users
	(id serial,
	email varchar(50) not null,
	password varchar(64) not null,
	primary key (email));
    -- drop table if exists users;

-- 4. Insert sample data
insert into users (email,password) select 'test@test.com','password';

-- 5. Create functions
drop procedure if exists process;
delimiter $
create procedure process
(token varchar(60),action varchar(200),params JSON)
begin
	-- add business logic here
    
	-- final output
    SELECT json_object('code','d.a.01','message','Test data from mysql',
		'data',json_object('email',email)) as result
	FROM api_database.users;
end; $
	-- call process('some token','some action','{"data":"some data"}');

-- 6. Create user, grant permissions. Execute one line at a time
create user api_user@localhost identified with mysql_native_password by 'secret';
grant execute on procedure api_database.process to api_user@localhost;

