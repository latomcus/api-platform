-- https://github.com/latomcus/api-platform

-- 1. Create database
create database api_database;
-- select version();
	-- "PostgreSQL 11.1, compiled by Visual C++ build 1914, 64-bit"

-- 2. After database is created you need to establish new connection and continue the steps below

-- 3. Create schema
create schema if not exists service;
	-- drop schema service

-- 4. Create sample tables
create table if not exists users
	(id serial,
	email varchar(50) not null,
	password varchar(64) not null,
	primary key (email));
	-- drop table if exists users;

-- 5. Insert sample data
insert into users (email,password) select 'test@test.com','password'

-- 6. Create functions
create or replace function service.process
(token varchar(60)=null,action varchar(200)=null,payload JSON=null,out response JSON) as $$
begin
	-- add business logic here
	
	-- final output
	select json_build_object('code','d.a.01','message','Test data from PostgreSQL','data',(
		select json_build_object('email',email) from users)) into response;
end; $$ language plpgsql;
	-- drop function if exists service.process;
	-- select response from service.process();
	-- select service.process();

-- 7. Create role, user, and grant permissions. Execute one line at a time
create role api_user_role;
grant execute on function process(varchar(60),varchar(200),JSON,out JSON) to api_user_role;
grant usage on schema public,service to api_user_role;
grant all on all tables in schema public,service to api_user_role;
create user api_user with password 'secret';
grant api_user_role to api_user;
