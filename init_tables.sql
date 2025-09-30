use ppgarageGastos;

create table if not exists gastos(
    id int primary key auto_increment,
    descripcion varchar(100) not null,
    monto int not null,
    cantidadEnLts int not null,
    fecha date not null
);

create table if not exists clientes(
    id int primary key auto_increment,
    nombre varchar(100) not null,
    servicio varchar(100) not null,
    montoCobrado int not null
);

insert into gastos(descripcion, monto , cantidadEnLts, fecha) values
('Shampoo', 18000, 5, '2025-10-01'),
('Silicona', 18000, 1, '2025-10-01'),
('APC', 15000, 5, '2025-10-01'),
('Alumax', 29000, 5, '2025-10-01'),
('Removex', 29000, 5, '2025-10-01')
ON DUPLICATE KEY UPDATE id=id;