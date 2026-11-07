import sqlite3
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: init_sqlite_from_migrations.py <db_path> <migrations_dir>", file=sys.stderr)
        return 1

    db_path = Path(sys.argv[1]).resolve()
    migrations_dir = Path(sys.argv[2]).resolve()

    db_path.parent.mkdir(parents=True, exist_ok=True)

    migration_files = sorted(migrations_dir.glob("*/migration.sql"))
    if not migration_files:
        print(f"No migration.sql files found in {migrations_dir}", file=sys.stderr)
        return 1

    connection = sqlite3.connect(str(db_path))
    try:
        for migration_file in migration_files:
            sql = migration_file.read_text(encoding="utf-8")
            connection.executescript(sql)
        connection.commit()
    finally:
        connection.close()

    print(f"SQLite database initialized at {db_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
