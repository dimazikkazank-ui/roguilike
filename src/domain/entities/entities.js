// ИНВЕНТАРЬ
export const ItemTypes = {
  FOOD: "food", // еда (восстановление hp на определенную величину)
  ELIXIR: "elixir", // эликсир (временное действие)
  SCROLL: "scroll", // свитки (постоянный эффект)
  WEAPON: "weapon", // оружие (имеют характеристику силы)
  TREASURE: "treasure", // сокровища (имеют стоимость)
};

export const statTypes = {
  HEALTH: "health", // здоровье
  AGILITY: "agility", // ловкость
  STRENGTH: "strength", // сила
};

export class Item {
  constructor(type, name) {
    this._type = type;
    this._name = name;
  }

  get type() {
    return this._type;
  }
  get name() {
    return this._name;
  }
}

export class Food extends Item {
  constructor(name, toRegen) {
    super(ItemTypes.FOOD, name);
    this._toRegen = toRegen;
  }

  get toRegen() {
    return this._toRegen;
  }
}

export class Elixir extends Item {
  constructor(name, stat, increase, duration) {
    super(ItemTypes.ELIXIR, name);
    this._stat = stat; // 'health', 'agility', 'strength'
    this._increase = increase;
    this._duration = duration;
  }

  get stat() {
    return this._stat;
  }
  get increase() {
    return this._increase;
  }
  get duration() {
    return this._duration;
  }
}

export class Scroll extends Item {
  constructor(name, stat, increase) {
    super(ItemTypes.SCROLL, name);
    this._stat = stat; // 'health', 'agility', 'strength'
    this._increase = increase;
  }

  get stat() {
    return this._stat;
  }
  get increase() {
    return this._increase;
  }
}

export class Weapon extends Item {
  constructor(name, strength) {
    super(ItemTypes.WEAPON, name);
    this._strength = strength;
  }

  get strength() {
    return this._strength;
  }
}

export class Treasure extends Item {
  constructor(value) {
    super(ItemTypes.TREASURE, "Treasure");
    this._value = value;
  }
  get value() {
    return this._value;
  }
}

export class Backpack {
  constructor() {
    this.items = {
      food: [],
      elixir: [],
      scroll: [],
      weapon: [],
      treasure: { count: 0, value: 0 },
    };
  }

  // добавление предмета в рюкзак
  addItem(item) {
    const slot = this.items[item.type];
    if (slot.length < 9) {
      slot.push(item);
      return true;
    }

    if (item.type === ItemTypes.TREASURE) {
      this.items.treasure.count += 1;
      this.items.treasure.value += item.value;
      return true;
    }
    return false; // если рюкзак полный
  }

  // удаление предмета по типу и индексу
  removeItem(type, index) {
    if (this.items[type] && this.items[type][index]) {
      const item = this.items[type][index];
      this.items[type].splice(index, 1);
      return item;
    }
    return null;
  }

  takeFood(index) {
    return this.removeItem("food", index);
  }

  takeElixir(index) {
    const elixir = this.removeItem("elixir", index);
    if (elixir) {
      return {
        type: "temporary",
        stat: elixir.stat,
        increase: elixir.increase,
        duration: elixir.duration,
        name: elixir.name,
      };
    }
    return null;
  }

  takeScroll(index) {
    const scroll = this.removeItem("scroll", index);
    if (scroll) {
      return {
        type: "permanent",
        stat: scroll.stat,
        increase: scroll.increase,
        name: scroll.name,
      };
    }
    return null;
  }

  takeWeapon(index) {
    if (index === null || index === undefined) {
      return null;
    }
    return this.removeItem("weapon", index);
  }
}
