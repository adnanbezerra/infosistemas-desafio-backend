import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/validate-env';

const env = validateEnv(process.env);

export default new DataSource({
    type: 'mssql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: env.DB_LOGGING,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
});
