// import "reflect-metadata";

// import { AppDataSource } from "./infrastructure/database/datasource";
import { configuration } from "./config/configuration";
import app from "./app";
import { sequelize } from "./infrastructure/database/sequelize";

async function bootstrap() {
  try {
    // await AppDataSource.initialize();
    await sequelize.authenticate();

    console.log("PostgreSQL connected successfully");

    app.listen(configuration.app.port, () => {
      console.log(
        `Personal Finance API running on http://localhost:${configuration.app.port}`,
      );
    });
  } catch (error) {
    console.error("Failed to start application", error);

    process.exit(1);
  }
}

bootstrap();