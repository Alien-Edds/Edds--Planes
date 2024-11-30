import { EntityHealthComponent, MinecraftDimensionTypes, system, world } from "@minecraft/server";
import { PlaneRegistration } from "./Plane/data";
import { PlaneManager } from "./Plane/manager";
PlaneRegistration.initialize();
world.beforeEvents.itemUseOn.subscribe((data) => {
    if (data.block.typeId != "minecraft:mob_spawner" && data.block.typeId != "minecraft:trial_spawner")
        return;
    const planeData = PlaneRegistration.planes.find((f) => f.entityID == data.itemStack.typeId.replace("_spawn_egg", ""));
    if (!planeData)
        return;
    data.cancel = true;
});
system.runInterval(() => {
    for (const data of PlaneManager.getRiddenPlanes()) {
        PlaneManager.flyTick(data);
    }
}, 5);
world.afterEvents.entityHitEntity.subscribe((data) => {
    if (data.damagingEntity.typeId != "minecraft:player")
        return;
    const planeData = PlaneRegistration.planes.find((f) => f.entityID == data.hitEntity.typeId);
    if (!planeData)
        return;
    const plane = data.hitEntity;
    const player = data.damagingEntity;
    if (!player.isSneaking)
        return;
    if (!plane.isValid())
        return;
    const healthComp = plane.getComponent(EntityHealthComponent.componentId);
    if (healthComp.currentValue <= 0)
        return;
    const ownerID = PlaneManager.getOwnerID(plane);
    if (!ownerID)
        return;
    if (ownerID != player.id)
        return;
    PlaneManager.pickupPlane(plane);
});
system.afterEvents.scriptEventReceive.subscribe((data) => {
    if (data.id != "eddsplanes:is_loaded")
        return;
    world.getDimension(MinecraftDimensionTypes.overworld).runCommand("scriptevent eddsplanes:loaded");
});
