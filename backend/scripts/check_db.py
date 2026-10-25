import asyncio
from sqlalchemy import text
from app.core.database import engine


async def main():
    async with engine.connect() as conn:
        res = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        )
        tables = [row[0] for row in res.fetchall()]
        print("TOTAL_TABLES_IN_NEON:", len(tables))
        for t in tables:
            print("  [x] Table:", t)


if __name__ == "__main__":
    asyncio.run(main())
