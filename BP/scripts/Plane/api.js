import { EntityRidingComponent, MinecraftDimensionTypes, Player, system, world } from "@minecraft/server";
export const Overworld = world.getDimension(MinecraftDimensionTypes.overworld);
export class PlaneAPI {
    registery = {
        fuelItems: [],
        consumableItems: [],
        planes: [],
    };
    async registerFuelItem(data) {
        const loaded = await this.checkMainLoaded();
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.");
            return;
        }
        this.registery.fuelItems.push(data);
        Overworld.runCommand(`scriptevent eddsplanes:register_fuel_item ${JSON.stringify(data)}`);
    }
    async registerConsumableItem(data) {
        const loaded = await this.checkMainLoaded();
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.");
            return;
        }
        this.registery.consumableItems.push(data);
        Overworld.runCommand(`scriptevent eddsplanes:register_consumable_item ${JSON.stringify(data)}`);
    }
    async registerPlane(data) {
        const loaded = await this.checkMainLoaded();
        if (!loaded) {
            console.warn("(PLANE API) Main addon not loaded. Returning.");
            return;
        }
        this.registery.planes.push(data);
        Overworld.runCommand(`scriptevent eddsplanes:register_plane ${JSON.stringify(data)}`);
    }
    async checkMainLoaded() {
        let isLoaded = false;
        await new Promise(resolve => {
            const firstTick = world.getAbsoluteTime();
            const event = system.afterEvents.scriptEventReceive.subscribe((data) => {
                if (data.id != "eddsplanes:loaded")
                    return;
                system.afterEvents.scriptEventReceive.unsubscribe(event);
                system.clearRun(runInterval);
                isLoaded = true;
                resolve(resolve);
            });
            const runInterval = system.runInterval(() => {
                if (isLoaded) {
                    system.clearRun(runInterval);
                    resolve(resolve);
                    return;
                }
                if (world.getAbsoluteTime() - firstTick > 5) {
                    console.warn("(PLANE API) Main addon not loaded.");
                    system.afterEvents.scriptEventReceive.unsubscribe(event);
                    system.clearRun(runInterval);
                    resolve(resolve);
                    return;
                }
            });
        });
        return isLoaded;
    }
    constructor() {
        system.afterEvents.scriptEventReceive.subscribe((data) => {
            const consumableItem = this.registery.consumableItems.find((f) => f.codeId == data.id);
            if (!consumableItem)
                return;
            const player = data.sourceEntity;
            if (!player || !(player instanceof Player))
                return;
            const plane = player.getComponent(EntityRidingComponent.componentId)?.entityRidingOn;
            if (!plane)
                return;
            consumableItem.code(player, plane);
        });
    }
}
