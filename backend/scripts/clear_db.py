import asyncio
from sqlalchemy import text
from app.core.database import engine

EXCLUDED_TABLES = {"alembic_version"}

async def clear_database():
    print("=" * 60)
    print("🚀 Đang kết nối tới Neon PostgreSQL để clear dữ liệu...")
    print("=" * 60)

    async with engine.begin() as conn:
        # Lấy danh sách toàn bộ tables trong public schema
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        )
        all_tables = [row[0] for row in result.fetchall()]
        tables_to_truncate = [t for t in all_tables if t not in EXCLUDED_TABLES]

        if not tables_to_truncate:
            print("⚠️ Không tìm thấy bảng nào cần xóa dữ liệu.")
            return

        print(f"📋 Các bảng sẽ được xóa dữ liệu (giữ lại cấu trúc bảng & {', '.join(EXCLUDED_TABLES)}):")
        for t in tables_to_truncate:
            print(f"   - {t}")

        # Tạo câu lệnh TRUNCATE TABLE ... RESTART IDENTITY CASCADE
        quoted_tables = ", ".join([f'"{t}"' for t in tables_to_truncate])
        truncate_query = f"TRUNCATE TABLE {quoted_tables} RESTART IDENTITY CASCADE;"
        
        print("\n⏳ Đang thực thi TRUNCATE...")
        await conn.execute(text(truncate_query))
        print("✅ Đã hoàn tất TRUNCATE thành công!\n")

    # Kiểm tra lại số lượng dòng của từng bảng
    print("=" * 60)
    print("🔍 KIỂM TRA LẠI SỐ LƯỢNG DÒNG (ROW COUNT) SAU KHI XÓA:")
    print("=" * 60)
    async with engine.connect() as conn:
        for t in all_tables:
            count = (await conn.execute(text(f'SELECT COUNT(*) FROM "{t}"'))).scalar()
            status = " [GIỮ NGUYÊN]" if t in EXCLUDED_TABLES else " [ĐÃ XÓA SẠCH]"
            print(f"  • {t:<25}: {count} dòng{status}")
    print("=" * 60)
    print("🎉 Hoàn tất clear dữ liệu database!")

if __name__ == "__main__":
    asyncio.run(clear_database())
