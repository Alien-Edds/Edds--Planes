import { Entity, EntityRidingComponent, MinecraftDimensionTypes, Player, system, world } from "@minecraft/server";

export const Overworld = world.getDimension(MinecraftDimensionTypes.overworld)

export interface Plane {
    /**
     * The plane entity identifier.
     */
    entityID: string,
    /**
     * The speed that the plane will fly at.
     */
    speed: number,
    /**
     * The speed the plane consumes fuel at. Default: 1
     */
    fuelConsumption: number,
    /**
     * Optional parameter for a custom camera.
     */
    camera?: {
        yDist: number,
        xzDist: number
    }
}

export interface FuelItem {
    /**
     * The item identifier.
     */
    itemID: string,
    /**
     * The amount of fuel this item gives. 4 = 1 second of fuel.
     */
    fuelAmount: number,
    /**
     * Optional parameter to replace this item with another item when it's used. eg: lava bucket -> bucket
     */
    replaceWith?: {
        /**
         * The item identifier.
         */
        itemID: string,
        /**
         * The item amount.
         */
        amount: number
    }
}

export interface ConsumableItem {
    /**
     * The item identifier.
     */
    itemID: string,
    /**
     * The cooldown that this item starts after it's used. No consumable items will be usable during this time. 1 = 5 ticks
     */
    cooldown: number,
    /**
     * Code to run when this consumable item is used.
     */
    code: (player: Player, plane: Entity) => void
}

export interface RiddenPlane {
    plane: Entity,
    driver: Player
}

export class PlaneAPI {
    registery: { [string: string]: FuelItem[] | ConsumableItem[] | Plane[] } = {
        fuelItems: [] as FuelItem[],
        consumableItems: [] as ConsumableItem[],
        planes: [] as Plane[],
    }
    async registerFuelItem(data: FuelItem) {
        const loaded = await this.checkMainLoaded()
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.")
            return
        }
        (this.registery.fuelItems as FuelItem[]).push(data)
        Overworld.runCommand(`scriptevent eddsplanes:register_fuel_item ${JSON.stringify(data)}`)
    }
    async registerConsumableItem(data: ConsumableItem) {
        const loaded = await this.checkMainLoaded()
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.")
            return
        }
        (this.registery.consumableItems as ConsumableItem[]).push(data)
        Overworld.runCommand(`scriptevent eddsplanes:register_consumable_item ${JSON.stringify(data)}`)
    }
    async registerPlane(data: Plane) {
        const loaded = await this.checkMainLoaded()
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.")
            return
        }
        (this.registery.planes as Plane[]).push(data)
        Overworld.runCommand(`scriptevent eddsplanes:register_plane ${JSON.stringify(data)}`)
    }
    async checkMainLoaded(): Promise<boolean> {
        let isLoaded = false
        await new Promise(resolve => {
            const firstTick = world.getAbsoluteTime()
            Overworld.runCommand("scriptevent eddsplanes:is_loaded")
            const event = system.afterEvents.scriptEventReceive.subscribe((data) => {
                if (data.id != "eddsplanes:loaded") return
                system.afterEvents.scriptEventReceive.unsubscribe(event)
                system.clearRun(runInterval)
                isLoaded = true
                resolve(resolve)
            })
            const runInterval = system.runInterval(() => {
                if (isLoaded) {
                    system.clearRun(runInterval)
                    resolve(resolve)
                    return
                }
                if (world.getAbsoluteTime() - firstTick > 5) {
                    console.warn("(PLANE API) Main addon not loaded.")
                    system.afterEvents.scriptEventReceive.unsubscribe(event)
                    system.clearRun(runInterval)
                    resolve(resolve)
                    return
                }
            })
        })
        return isLoaded
    }
    constructor() {
        system.afterEvents.scriptEventReceive.subscribe((data) => {
            if (data.id !== "eddsplanes:consume_item") return
            const consumableItem = (this.registery.consumableItems as ConsumableItem[]).find((f) => f.itemID === data.message)
            if (!consumableItem) return
            const player = data.sourceEntity
            if (!player || !(player instanceof Player)) return
            const plane = (player.getComponent(EntityRidingComponent.componentId) as EntityRidingComponent)?.entityRidingOn
            if (!plane) return
            consumableItem.code(player, plane)
        })
    }
}