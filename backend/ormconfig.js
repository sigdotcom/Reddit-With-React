const ROOT_DIR = "./"
const EXT = ".ts"

module.exports = {
   "type": "postgres",
   "host": process.env.DB_HOST || "localhost",
   "username": process.env.DB_USERNAME || "postgres",
   "password": process.env.DB_PASSWORD || "",
   "database": process.env.DB_TABLE || "pheonix",
   "port": process.env.DB_PORT || 5432,
   "synchronize": true,
   "logging": true,
   "entities": [
      ROOT_DIR + "entity/**/*" + EXT
   ],
   "migrations": [
      ROOT_DIR + "migration/**/*" + EXT
   ],
   "subscribers": [
      ROOT_DIR + "subscriber/**/*" + EXT
   ],
   "cli": {
      "entitiesDir": ROOT_DIR + "entity",
      "migrationsDir": ROOT_DIR + "migration",
      "subscribersDir": ROOT_DIR + "subscriber"
   }
}
