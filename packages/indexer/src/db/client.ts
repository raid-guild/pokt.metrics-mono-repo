import 'dotenv/config';

import { Pool } from 'pg';

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  database: process.env.DATABASE_NAME,
};

if (process.env.DATABASE_SSL_ENABLED === 'true') {
  Object.assign(config, {
    ssl: {
      rejectUnauthorized: true,
      ca: `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUE4UmOj76hZ1eHUpZkyP90Wqq1KAwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1MjMzZjQ2MjgtYTQ1MC00MWI1LWI2NjktODYxODkzZTQ5
NjgyIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNzAxMDQyNTQyWhcNMzUwNjI5MDQy
NTQyWjBAMT4wPAYDVQQDDDUyMzNmNDYyOC1hNDUwLTQxYjUtYjY2OS04NjE4OTNl
NDk2ODIgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAIavvqvgVMRnFDEU3ruPIVf0oZFY2CQc1uG/sUxd/mIEHnVysFBOTw+O
9Zt4/DPVYE7I4GBhT0DFsLBPMP4cXPg/q3k8PASoUcl2l5fZAYwfL/ypp0VUkdmX
KSgxl/iP9QSKUQy9MzEgybvPd+9Xki5wlu4SoPEozuNn1ljNitD9Jq9+2ao955In
OyRZ0HcnnbprjtEZ89zkxlCB92/fRRp+P41AFWmOc4ym1J+m2WZgnva5XwAOV1vC
IC/KYUWho1i7qFOODMJpFQ8azpbIJlwCx/gDe/5VfqsPJMNBEw+i4xU/LVjJD8gk
cVuzUz3ak5vKxfoSnQJQkWHDGcRnXgzU4xim5yHimYvIZliVp4TlxZXmebRXMRO6
vumOGiNUKzDya7LPDwphRHF2cyoeYp/I3LQ+vxE+Ihqi1sV/TYi2eTq1B1mU9D1O
6hVeNgoT0BMhflETGIbU+cbhDM6o7vsy69geppQCBfe/Wc60AoF2a4z8jmPgKupX
mkWRs/e41wIDAQABo0IwQDAdBgNVHQ4EFgQU6zmCmLs1Tg5PL7U8fZaPqiCf2XAw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAD6Ehn96DtkJ9gX1LwY4ksK7rKCfuN7C41gNzXQ4UmFkDqQFxXrccDkYGlPX
E4FmtdCFKmx6Fn1vHOROZ33ioPhwtjuyFvnMSo9u6JKlrKS3hxvsaBbidVfgllZS
ldZ/j6vmCtnNxmoDrz5xp8EdXN2+qDHN+KqTNH1b6ATcHo5PEVTc4wBEh2mU+Laz
Jm1xJfZ6E3c3/RX+sQSnzMLBZRBQd8AOg/6uYVoIo2QEKfZxxUzn/vTKUNcseqQP
7svHb1m8j/XxXesh6BU387nnHPU5nMUN077gLYOv5QyCIUYdTKa6sdvUwxoYwxAn
2p3MAuy0NuxXKkaHWK1qZfWwYcyz/oBiGenNkM2ZtJqT+gdbnEejnCMEkurbxAxA
PV3xiUh79na1UqHXZCH2Hh/M4YMsHfQ1Jv5i0GGlwoouxSQoXVf2XgAFyh9XFad/
HcGwaq2tKzfgvZ/CUaz6s7AteXCJc6j4uVNYn4/N4Ak/vByYJ550iaZJFvxR2Iav
5L0RmQ==
-----END CERTIFICATE-----`,
    },
  });
}

export const db = new Pool(config);
