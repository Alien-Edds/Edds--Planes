import { system } from "@minecraft/server";
import { EntityManager } from "../Entity/manager";
import { PlaneAPI } from "./api";
export class PlaneRegistration {
    static planes = [];
    static consumableItems = [];
    static fuelItems = [];
    static register(plane, consumableItem, fuelItem) {
        if (plane)
            this.planes.push(plane);
        if (consumableItem)
            this.consumableItems.push(consumableItem);
        if (fuelItem)
            this.fuelItems.push(fuelItem);
    }
    static initialize() {
        system.afterEvents.scriptEventReceive.subscribe((data) => {
            if (!data.id.startsWith("eddsplanes:"))
                return;
            switch (data.id.split(":")[1]) {
                case "register_consumable_item":
                    try {
                        if (this.consumableItems.find((f) => f.itemID == JSON.parse(data.message).itemID) !== undefined) {
                            console.warn(`(Edds' Planes) Consumable item already loaded: ${JSON.parse(data.message).itemID} `);
                            return;
                        }
                        this.consumableItems.push(JSON.parse(data.message));
                    }
                    catch {
                        console.warn("(Edds' Planes) Malformed json for consumable item registration.");
                    }
                    break;
                case "register_fuel_item":
                    try {
                        if (this.fuelItems.find((f) => f.itemID == JSON.parse(data.message).itemID)) {
                            console.warn(`(Edds' Planes) Fuel item already loaded: ${JSON.parse(data.message).itemID} `);
                            return;
                        }
                        this.fuelItems.push(JSON.parse(data.message));
                    }
                    catch {
                        console.warn("(Edds' Planes) Malformed json for fuel item registration.");
                    }
                    break;
                case "register_plane":
                    try {
                        if (this.planes.find((f) => f.entityID == JSON.parse(data.message).entityID)) {
                            console.warn(`(Edds' Planes) Plane already loaded: ${JSON.parse(data.message).entityID} `);
                            return;
                        }
                        this.planes.push(JSON.parse(data.message));
                    }
                    catch {
                        console.warn("(Edds' Planes) Malformed json for plane registration.");
                    }
                    break;
            }
        });
    }
}
/* MAIN REGISTRATIONS */
const registery = new PlaneAPI();
//PLANES
registery.registerPlane({
    entityID: "eddsplanes:plane",
    fuelConsumption: 1,
    speed: 1,
    camera: {
        yDist: 8,
        xzDist: 10
    }
});
//CONSUMABLES
registery.registerConsumableItem({
    itemID: "minecraft:tnt",
    cooldown: 12,
    codeId: "eddsplanes:default_tnt_item_code",
    code: (player, plane) => {
        EntityManager.spawnEntityAnywhere("minecraft:tnt", plane.location, player.dimension);
    }
});
//FUEL
registery.registerFuelItem({
    itemID: "minecraft:lava_bucket",
    fuelAmount: 250,
    replaceWith: {
        itemID: "minecraft:bucket",
        amount: 1
    }
});
registery.registerFuelItem({
    itemID: "minecraft:charcoal",
    fuelAmount: 20
});
registery.registerFuelItem({
    itemID: "minecraft:coal",
    fuelAmount: 20
});
registery.registerFuelItem({
    itemID: "minecraft:coal_block",
    fuelAmount: 20 * 9
});
