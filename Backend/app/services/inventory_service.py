# app/services/inventory_service.py

from sqlalchemy.ext.mutable import MutableDict, MutableList

def add_drop_to_inventory(user, drop_id: int, count: int = 1):
    inventory = user.inventory or []

    # делаем список mutable
    inventory = MutableList(inventory)

    for item in inventory:
        if int(item.get("drop_id")) == drop_id:
            mutable_item = MutableDict(item)
            mutable_item["count"] = int(mutable_item.get("count", 0)) + count

            idx = inventory.index(item)
            inventory[idx] = mutable_item

            user.inventory = inventory
            return

    # если не нашли — добавляем новый
    inventory.append(MutableDict({
        "drop_id": drop_id,
        "count": count
    }))

    user.inventory = inventory
