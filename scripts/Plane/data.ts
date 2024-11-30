import { Entity, MinecraftDimensionTypes, Player, system, world } from "@minecraft/server";
import { EntityManager } from "../Entity/manager";
import { ConsumableItem, FuelItem, Plane, PlaneAPI } from "./api";

export class PlaneRegistration{
    static planes: Plane[] = []
    static consumableItems: ConsumableItem[] = []
    static fuelItems: FuelItem[] = []
    static register(plane?: Plane, consumableItem?: ConsumableItem, fuelItem?: FuelItem) {
        if (plane) this.planes.push(plane)
        if (consumableItem) this.consumableItems.push(consumableItem)
        if (fuelItem) this.fuelItems.push(fuelItem)
    }
    static initialize() {
        system.afterEvents.scriptEventReceive.subscribe((data) => {
            if (!data.id.startsWith("eddsplanes:")) return
            switch (data.id.split(":")[1]) {
                case "register_consumable_item" :
                    try {
                        if (this.consumableItems.find((f) => f.itemID == (JSON.parse(data.message) as ConsumableItem).itemID) !== undefined) {
                            console.warn(`(Edds' Planes) Consumable item already loaded: ${(JSON.parse(data.message) as ConsumableItem).itemID} `)
                            return
                        }
                        this.consumableItems.push(JSON.parse(data.message))
                    } catch {console.warn("(Edds' Planes) Malformed json for consumable item registration.")}
                    break
                case "register_fuel_item" :
                    try {
                        if (this.fuelItems.find((f) => f.itemID == (JSON.parse(data.message) as FuelItem).itemID)) {
                            console.warn(`(Edds' Planes) Fuel item already loaded: ${(JSON.parse(data.message) as FuelItem).itemID} `)
                            return
                        }
                        this.fuelItems.push(JSON.parse(data.message))
                    } catch {console.warn("(Edds' Planes) Malformed json for fuel item registration.")}
                    break
                case "register_plane" :
                    try {
                        if (this.planes.find((f) => f.entityID == (JSON.parse(data.message) as Plane).entityID)) {
                            console.warn(`(Edds' Planes) Plane already loaded: ${(JSON.parse(data.message) as Plane).entityID} `)
                            return
                        }
                        this.planes.push(JSON.parse(data.message))
                    } catch {console.warn("(Edds' Planes) Malformed json for plane registration.")}
                    break
            } 
        })
    }
}

/* MAIN REGISTRATIONS */

const registery = new PlaneAPI()

//PLANES
registery.registerPlane({
    entityID: "eddsplanes:plane",
    fuelConsumption: 1,
    speed: 1,
    camera: {
        yDist: 8,
        xzDist: 10
    }
})

//CONSUMABLES
registery.registerConsumableItem({
    itemID: "minecraft:tnt",
    cooldown: 8,
    code: (player: Player, plane: Entity) => {
        EntityManager.spawnEntityAnywhere("minecraft:tnt", plane.location, player.dimension)
    }
})

//FUEL
registery.registerFuelItem({
    itemID: "minecraft:lava_bucket",
    fuelAmount: 250,
    replaceWith: {
        itemID: "minecraft:bucket",
        amount: 1
    }
})

registery.registerFuelItem({
    itemID: "minecraft:charcoal",
    fuelAmount: 20
})

registery.registerFuelItem({
    itemID: "minecraft:coal",
    fuelAmount: 20
})

registery.registerFuelItem({
    itemID: "minecraft:coal_block",
    fuelAmount: 20 * 9
})