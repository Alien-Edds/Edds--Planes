import { EasingType, EntityInventoryComponent, EntityRideableComponent, EntityRidingComponent, ItemStack, world } from "@minecraft/server";
import { PlaneRegistration } from "./data";
import { roundUp } from "../Math/roundUp";
export class PlaneManager {
    static getLastText(player) {
        return player.getDynamicProperty("lastText");
    }
    static setLastText(player, text) {
        player.setDynamicProperty("lastText", text);
    }
    static getRiddenPlanes() {
        const riddenPlanes = [];
        for (const player of world.getAllPlayers()) {
            const comp = player.getComponent(EntityRidingComponent.componentId);
            if (!comp) {
                if (player.hasTag("eddsplanes.driving_plane")) {
                    player.onScreenDisplay.setTitle("§a");
                    player.removeTag("eddsplanes.driving_plane");
                    player.camera.clear();
                }
                continue;
            }
            const planeData = PlaneRegistration.planes.find((f) => f.entityID == comp.entityRidingOn.typeId);
            if (!planeData)
                continue;
            const ridingComp = comp.entityRidingOn.getComponent(EntityRideableComponent.componentId);
            const rider = ridingComp.getRiders()[0];
            if (rider.id != player.id) {
                if (player.hasTag("eddsplanes.driving_plane")) {
                    player.onScreenDisplay.setTitle("§a");
                    player.removeTag("eddsplanes.driving_plane");
                    player.camera.clear();
                }
                continue;
            }
            riddenPlanes.push({ plane: comp.entityRidingOn, driver: player });
        }
        return riddenPlanes;
    }
    static flyTick(data) {
        const { plane, driver } = data;
        const planeData = PlaneRegistration.planes.find((f) => f.entityID == plane.typeId);
        if (!planeData)
            return;
        if (planeData.camera) {
            if (plane.isOnGround) {
                this.setCamera(driver, plane, { y: planeData.camera.yDist * 0.7, xz: planeData.camera.xzDist * 0.7 });
            }
            else
                this.setCamera(driver, plane, { y: planeData.camera.yDist, xz: planeData.camera.xzDist });
        }
        const ownerID = this.getOwnerID(plane);
        if (!ownerID)
            this.setOwnerID(plane, driver.id);
        const fuel = this.getFuel(plane);
        const lastFuel = this.getLastFuel(plane);
        let titleText = "eddsplanes.0";
        if (lastFuel)
            titleText = `eddsplanes.${roundUp((fuel / lastFuel) * 9)}`;
        if (fuel > 0) {
            if (!plane.isOnGround) {
                this.setFuel(plane, fuel - planeData.fuelConsumption);
                this.flyKnockback(plane, planeData, driver);
                this.runConsumables(driver, plane);
            }
            else
                this.setCooldown(plane, 4);
        }
        else {
            const inv = plane.getComponent(EntityInventoryComponent.componentId);
            const container = inv.container;
            if (container) {
                let foundFuel = false;
                for (let i = 0; i < container.size; i++) {
                    if (foundFuel)
                        continue;
                    const item = container.getItem(container.size - (i + 1));
                    if (!item)
                        continue;
                    const fuelData = PlaneRegistration.fuelItems.find((f) => f.itemID == item.typeId);
                    if (!fuelData)
                        continue;
                    foundFuel = true;
                    titleText = "eddsplanes.9";
                    this.setFuel(plane, fuelData.fuelAmount);
                    this.setLastFuel(plane, fuelData.fuelAmount);
                    if (item.amount > 1) {
                        item.amount = item.amount - 1;
                        container.setItem(container.size - (i + 1), item);
                    }
                    else {
                        if (fuelData.replaceWith) {
                            const replaceItem = new ItemStack(fuelData.replaceWith.itemID, fuelData.replaceWith.amount);
                            container.setItem(container.size - (i + 1), replaceItem);
                        }
                        else
                            container.setItem(container.size - (i + 1), undefined);
                    }
                    if (!plane.isOnGround) {
                        this.flyKnockback(plane, planeData, driver);
                    }
                }
            }
        }
        let hasTag = driver.hasTag("eddsplanes.driving_plane");
        if (this.getLastText(driver) == titleText && hasTag)
            return;
        if (!hasTag)
            driver.addTag("eddsplanes.driving_plane");
        driver.onScreenDisplay.setTitle(titleText);
        this.setLastText(driver, titleText);
    }
    static setCamera(player, plane, distance) {
        const viewDir = player.getViewDirection();
        const headLocation = player.getHeadLocation();
        const rot = player.getRotation();
        const cameraLocation = {
            x: headLocation.x + (-viewDir.x * distance.xz),
            y: (headLocation.y + (rot.x < 0 ? 3 : 1)) + ((-viewDir.y * distance.y) * 1.0),
            z: headLocation.z + (-viewDir.z * distance.xz)
        };
        const facing = {
            x: headLocation.x + (viewDir.x * distance.xz),
            y: (headLocation.y + 1) + ((viewDir.y * distance.y) * 1.0),
            z: headLocation.z + (viewDir.z * distance.xz)
        };
        const blockData = this.getBlock(headLocation, cameraLocation, Math.abs(headLocation.x - cameraLocation.x) + Math.abs(headLocation.y - cameraLocation.y) + Math.abs(headLocation.z - cameraLocation.z), player.dimension);
        if (blockData.hitBlock) {
            player.camera.setCamera("minecraft:free", { facingLocation: facing, location: blockData.lastClearLocation, easeOptions: { easeTime: 0.5, easeType: EasingType.Linear } });
        }
        else {
            player.camera.setCamera("minecraft:free", { facingLocation: facing, location: cameraLocation, easeOptions: { easeTime: 0.5, easeType: EasingType.Linear } });
        }
    }
    static getBlock(from, to, steps, dimension) {
        let block = undefined;
        let clearLocation = undefined;
        let found = false;
        for (let i = 0; i < steps; i++) {
            if (found)
                continue;
            const divNum = i / steps;
            const loc = {
                x: from.x - ((from.x - to.x) * divNum),
                y: from.y - ((from.y - to.y) * divNum),
                z: from.z - ((from.z - to.z) * divNum)
            };
            let blockInLoc = undefined;
            try {
                blockInLoc = dimension.getBlock(loc);
            }
            catch { }
            if (blockInLoc) {
                if (!blockInLoc.isAir && !blockInLoc.isLiquid) {
                    found = true;
                    block = blockInLoc;
                }
                else
                    clearLocation = loc;
            }
            else
                clearLocation = loc;
        }
        return { hitBlock: block, lastClearLocation: clearLocation };
    }
    static flyKnockback(plane, planeData, driver) {
        plane.clearVelocity();
        const viewDir = driver.getViewDirection();
        const planeViewDir = plane.getViewDirection();
        const rotation = driver.getRotation();
        let yValue = 0;
        if (rotation.x > 5)
            yValue = viewDir.y;
        if (rotation.x < 5)
            yValue = 0.15 + viewDir.y;
        plane.applyImpulse({ x: planeViewDir.x * planeData.speed, y: (yValue * planeData.speed) * 0.75, z: planeViewDir.z * planeData.speed });
    }
    static pickupPlane(plane) {
        const inv = plane.getComponent(EntityInventoryComponent.componentId);
        if (!inv)
            return;
        if (!inv.container)
            return;
        for (let i = 0; i < inv.container.size; i++) {
            const item = inv.container.getItem(i);
            if (!item)
                continue;
            this.spawnItemAnywhere(item, plane.location, plane.dimension);
        }
        const item = new ItemStack(`${plane.typeId}_spawn_egg`);
        this.spawnItemAnywhere(item, plane.location, plane.dimension);
        plane.remove();
    }
    static runConsumables(player, plane) {
        const cooldown = this.getCooldown(plane);
        if (cooldown <= 0) {
            const inv = plane.getComponent(EntityInventoryComponent.componentId);
            const container = inv.container;
            if (!container)
                return;
            let foundItem = false;
            let cooldownAmount = 8;
            for (let i = 0; i < container.size; i++) {
                if (foundItem)
                    continue;
                const item = container.getItem(container.size - (i + 1));
                if (!item)
                    continue;
                const consumableData = PlaneRegistration.consumableItems.find((f) => f.itemID == item.typeId);
                if (!consumableData)
                    continue;
                foundItem = true;
                if (item.amount > 1) {
                    item.amount = item.amount - 1;
                    container.setItem(container.size - (i + 1), item);
                }
                else {
                    container.setItem(container.size - (i + 1), undefined);
                }
                player.runCommand(`scriptevent eddsplanes:consume_item ${consumableData.itemID}`);
                cooldownAmount = consumableData.cooldown;
            }
            this.setCooldown(plane, cooldownAmount);
        }
        else {
            this.setCooldown(plane, cooldown - 1);
        }
    }
    static getCooldown(plane) {
        const cooldown = plane.getDynamicProperty("cooldown");
        if (cooldown) {
            return cooldown;
        }
        else {
            plane.setDynamicProperty("cooldown", 0);
            return 0;
        }
    }
    static setCooldown(plane, cooldown) {
        plane.setDynamicProperty("cooldown", cooldown);
    }
    static getFuel(plane) {
        const fuel = plane.getDynamicProperty("fuel");
        if (fuel) {
            return fuel;
        }
        else {
            plane.setDynamicProperty("fuel", 0);
            return 0;
        }
    }
    static setFuel(plane, fuel) {
        plane.setDynamicProperty("fuel", fuel);
    }
    static getLastFuel(plane) {
        return plane.getDynamicProperty("lastFuel");
    }
    static setLastFuel(plane, lastFuel) {
        plane.setDynamicProperty("lastFuel", lastFuel);
    }
    static getOwnerID(plane) {
        const ownerID = plane.getDynamicProperty("owner");
        return ownerID;
    }
    static setOwnerID(plane, id) {
        plane.setDynamicProperty("owner", id);
    }
    static spawnItemAnywhere(item, location, dimension) {
        const itemEntity = dimension.spawnItem(item, { x: location.x, y: 100, z: location.z });
        itemEntity.teleport(location);
        return itemEntity;
    }
}
