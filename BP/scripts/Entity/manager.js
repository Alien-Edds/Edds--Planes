export class EntityManager {
    static spawnEntityAnywhere(entityID, location, dimension) {
        const entity = dimension.spawnEntity(entityID, { x: location.x, y: 100, z: location.z });
        entity.teleport(location);
        return entity;
    }
}
