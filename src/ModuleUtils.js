export const ReasonType = {
    None: -1,
    EndTurnNoCombat: 0,
    EndTurnNoCombatantPlaying: 1,
    EndTurnActorIsNotValid: 2,
    EndTurnNotYourTurn: 3,
    EndTurnLastOrSecondLast: 4,
    EndTurnInvalidSelectedCombatant: 5,
    EndTurnInvalidCombatId: 6,
    TryGetTokenInvalidId: 7,
    TryGetTokenInvalidCombatantId: 8
};

export class NotificationUtils
{
    static notify(reason)
    {
        switch (reason)
        {
        case ReasonType.EndTurnNoCombat:
            this.warning(locSystem(`EndTurnNoCombat`));
            break;
        case ReasonType.EndTurnNoCombatantPlaying:
            this.warning(locSystem(`EndTurnNoCombatantPlaying`));
            break;
        case ReasonType.EndTurnActorIsNotValid:
            this.warning(locSystem(`EndTurnActorIsNotValid`));
            break;
        case ReasonType.EndTurnNotYourTurn:
            this.warning(locSystem(`EndTurnNotYourTurn`));
            break;
        case ReasonType.EndTurnInvalidSelectedCombatant:
            this.warning(locSystem(`EndTurnInvalidSelectedCombatant`));
            break;
        case ReasonType.EndTurnLastOrSecondLast:
            this.warning(locSystem(`EndTurnLastOrSecondLast`));
            break;
        case ReasonType.EndTurnInvalidCombatId:
            this.warning(locSystem(`EndTurnInvalidCombatId`));
            break;
        case ReasonType.TryGetTokenInvalidId:
            this.warning(locSystem(`TryGetTokenInvalidId`));
            break;
        case ReasonType.TryGetTokenInvalidCombatantId:
            this.warning(locSystem(`TryGetTokenInvalidCombatantId`));
            break;
        }
    }

    static error(message)
    {
        ui.notifications.error(this._moduleMessage(message));
    }

    static warning(message)
    {
        ui.notifications.warn(this._moduleMessage(message));
    }

    static errorPromise(message)
    {
        return new Promise(() => { throw new Error(message); });
    }

    static _moduleMessage(message)
    {
        return `Popcorn Initiative - ${message}`;
    }
}

export class ModuleUtils
{
    static getCombatantById(combat, combatantId)
    {
        return combat.turns.find((x) => { return x.id === combatantId; });
    }

    static getCombatById(combatId)
    {
        return game.combats.get(combatId);
    }

    static tryGetToken(combat, combatantId)
    {
        let result = true;
        let token = null;
        let reason = ReasonType.None;
        const combatant = this.getCombatantById(combat, combatantId);
        if (!combatant)
        {
            reason = ReasonType.TryGetTokenInvalidCombatantId;
            result = false;
        }
        else
        {
            token = game.canvas.tokens.objects.children.find((x) => x.id === combatant.tokenId);
            if (!token)
            {
                reason = ReasonType.TryGetTokenInvalidId;
                result = false;
            }
        }

        return { result, token, reason };
    }

    static retrieveOwnersInfo(actorId)
    {
        const owners = [];
        const actor = game.actors.get(actorId);
        for (const key in actor.ownership)
        {
            const ownershipLevel = actor.ownership[key];
            if (key !== "default")
            {
                const player = game.users.get(key);
                if (ownershipLevel === 3 && !player.isGM)
                {
                    owners.push({ color: player.color });
                }
            }
        }
        return owners;
    }

    /*
You should never see the Selection Window if there's no valid combat.
If the current combatant in the fight is not owned by the player the Selection Window shouldn't be shown
If you are the last or the second last combatant in the round the popcorn initiative will select automatically according to the options
*/
    static shouldCloseSelectionWindow(combat)
    {
        let reason = ReasonType.None;

        if (!combat || !combat.current)
        {
            reason = ReasonType.EndTurnNoCombat;
        }
        else if (combat.current.combatantId == null)
        {
            reason = ReasonType.EndTurnNoCombatantPlaying;
        }
        else
        {
            const actorId = combat.turns.length > combat.turn ? combat.turns[combat.turn].actorId : "0";
            const actor = game.actors.get(actorId);
            if (actor == null)
            {
                reason = ReasonType.EndTurnActorIsNotValid;
            }
            else if (!actor.isOwner)
            {
                reason = ReasonType.EndTurnNotYourTurn;
            }
            else if (combat.current.turn + 1 >= combat.turns.length || combat.current.turn + 2 >= combat.turns.length)
            {
                reason = ReasonType.EndTurnLastOrSecondLast;
            }
        }

        return { shouldClose: reason !== ReasonType.None, reason };
    }
}

/**
 *
 * @param localizationKey
 */
export function locWindow(localizationKey)
{
    return localize(`Window.${localizationKey}`);
}

/**
 *
 * @param localizationKey
 */
export function locSystem(localizationKey)
{
    return localize(`SystemMessage.${localizationKey}`);
}

/**
 *
 * @param localizationKey
 */
function localize(localizationKey)
{
    return game.i18n.localize(`JPI.${localizationKey}`);
}
