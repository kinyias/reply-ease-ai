from typing import Any, Dict, List, Optional

CREDIT_PACKAGES: List[Dict[str, Any]] = [
    {
        "id": "pkg_100",
        "name": "100 Credits",
        "credits": 100,
        "bonus_credits": 0,
        "total_credits": 100,
        "price": 50000,
        "bonus_percentage": 0,
        "popular": False,
        "best_value": False,
        "description": "Gói trải nghiệm cơ bản, phù hợp thử nghiệm tính năng",
    },
    {
        "id": "pkg_200",
        "name": "200 Credits",
        "credits": 200,
        "bonus_credits": 10,
        "total_credits": 210,
        "price": 100000,
        "bonus_percentage": 5,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 10 credits (+5% bonus)",
    },
    {
        "id": "pkg_500",
        "name": "500 Credits",
        "credits": 500,
        "bonus_credits": 50,
        "total_credits": 550,
        "price": 200000,
        "bonus_percentage": 10,
        "popular": True,
        "best_value": False,
        "description": "Tặng thêm 50 credits (+10% bonus) - Được lựa chọn nhiều nhất",
    },
    {
        "id": "pkg_1000",
        "name": "1.000 Credits",
        "credits": 1000,
        "bonus_credits": 150,
        "total_credits": 1150,
        "price": 380000,
        "bonus_percentage": 15,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 150 credits (+15% bonus)",
    },
    {
        "id": "pkg_2000",
        "name": "2.000 Credits",
        "credits": 2000,
        "bonus_credits": 400,
        "total_credits": 2400,
        "price": 720000,
        "bonus_percentage": 20,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 400 credits (+20% bonus)",
    },
    {
        "id": "pkg_5000",
        "name": "5.000 Credits",
        "credits": 5000,
        "bonus_credits": 1250,
        "total_credits": 6250,
        "price": 1700000,
        "bonus_percentage": 25,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 1.250 credits (+25% bonus)",
    },
    {
        "id": "pkg_10000",
        "name": "10.000 Credits",
        "credits": 10000,
        "bonus_credits": 3000,
        "total_credits": 13000,
        "price": 3200000,
        "bonus_percentage": 30,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 3.000 credits (+30% bonus)",
    },
    {
        "id": "pkg_20000",
        "name": "20.000 Credits",
        "credits": 20000,
        "bonus_credits": 7000,
        "total_credits": 27000,
        "price": 6000000,
        "bonus_percentage": 35,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 7.000 credits (+35% bonus)",
    },
    {
        "id": "pkg_50000",
        "name": "50.000 Credits",
        "credits": 50000,
        "bonus_credits": 20000,
        "total_credits": 70000,
        "price": 14000000,
        "bonus_percentage": 40,
        "popular": False,
        "best_value": False,
        "description": "Tặng thêm 20.000 credits (+40% bonus)",
    },
    {
        "id": "pkg_100000",
        "name": "100.000 Credits",
        "credits": 100000,
        "bonus_credits": 50000,
        "total_credits": 150000,
        "price": 25000000,
        "bonus_percentage": 50,
        "popular": False,
        "best_value": True,
        "description": "Tặng thêm 50.000 credits (+50% bonus) - Mức ưu đãi cao nhất",
    },
]

# Lookup map by ID
CREDIT_PACKAGES_BY_ID: Dict[str, Dict[str, Any]] = {
    pkg["id"]: pkg for pkg in CREDIT_PACKAGES
}

# Lookup map by Price (VND)
CREDIT_PACKAGES_BY_PRICE: Dict[int, Dict[str, Any]] = {
    pkg["price"]: pkg for pkg in CREDIT_PACKAGES
}

# Lookup map by Base Credits
CREDIT_PACKAGES_BY_CREDITS: Dict[int, Dict[str, Any]] = {
    pkg["credits"]: pkg for pkg in CREDIT_PACKAGES
}


def get_credit_package(
    package_id: Optional[str] = None,
    amount: Optional[int] = None,
    order_code: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Helper to find the credit package matching package_id, amount, or order_code."""
    if package_id and package_id in CREDIT_PACKAGES_BY_ID:
        return CREDIT_PACKAGES_BY_ID[package_id]

    if order_code and "CRD_" in order_code:
        # Expected formats: CRD_pkg_500_..., CRD_500_..., etc.
        parts = order_code.split("_")
        if len(parts) >= 2:
            candidate_id = parts[1]
            if candidate_id in CREDIT_PACKAGES_BY_ID:
                return CREDIT_PACKAGES_BY_ID[candidate_id]
            if f"pkg_{candidate_id}" in CREDIT_PACKAGES_BY_ID:
                return CREDIT_PACKAGES_BY_ID[f"pkg_{candidate_id}"]
            try:
                crd_val = int(candidate_id)
                if crd_val in CREDIT_PACKAGES_BY_CREDITS:
                    return CREDIT_PACKAGES_BY_CREDITS[crd_val]
            except ValueError:
                pass

    if amount and amount in CREDIT_PACKAGES_BY_PRICE:
        return CREDIT_PACKAGES_BY_PRICE[amount]

    return None
