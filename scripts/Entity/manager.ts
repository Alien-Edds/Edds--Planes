import { Dimension, Entity, Vector3 } from "@minecraft/server"

export class EntityManager{
    static spawnEntityAnywhere(entityID: string, location: Vector3, dimension: Dimension): Entity {
        const entity = dimension.spawnEntity(entityID, {x: location.x, y: 100, z: location.z})
        entity.teleport(location)
        return entity
    }
}