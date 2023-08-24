import SelectionWindowApplication from "./view/selection-window/SelectionWindowApplication.js";
import { moduleSocket } from "./ModuleSocket.js";
import { NotificationUtils, ModuleUtils, ReasonType } from "./ModuleUtils.js";
import { StoreUpdater } from "./StoreUpdater.js";
import { get as svelteGet } from "svelte/store";
import {
    isSelectionWindowHovered,
    isTokenPickerRunning,
    overrideEndTurnButton,
    selectedCombatantId
} from "./ModuleStore.js";

export class ModuleAPI
{
    static get instance()
    {
        return game.modules.get("just-popcorn-initiative").api;
    }

    constructor()
    {
        this.selectionWindow = null;
        Hooks.on("createCombatant", (ev) => this._updateCombatantsData(ev));
        Hooks.on("deleteCombatant", (ev) => this._updateCombatantsData(ev));
        Hooks.on("updateCombat", (ev) => this._updateCombatantsData(ev));
        Hooks.on("canvasTearDown", () => this.closeSelectionWindow());
        Hooks.on("hoverToken", (token, isHover) =>
        {
            this._onHoverToken(token, isHover);
        });
        Hooks.on("renderCombatTracker", (app, html/* , data*/) =>
        {
            this._onRenderCombatTracker(app, html);
        });
        document.addEventListener("click", (e) =>
        {
            StoreUpdater.onGlobalClick();
        });
    }

    executePassTurnTo(combatantId)
    {
        const currentCombat = game.combat;
        moduleSocket.executeAsGM("passTurnTo", combatantId, currentCombat.id).then(() =>
        {
            this.closeSelectionWindow();
        }).catch((error) =>
        {
            NotificationUtils.error(error.options.cause);
        });
    }

    closeSelectionWindow()
    {
        this.selectionWindow?.close();
        this.selectionWindow = null;
        isTokenPickerRunning.set(false);
        isSelectionWindowHovered.set(false);
        selectedCombatantId.set("-1");
    }

    showSelectionWindowOrPassTurn()
    {
        const currentCombat = game.combat;
        const { shouldClose, reason } = ModuleUtils.shouldCloseSelectionWindow(currentCombat);
        if (reason === ReasonType.EndTurnLastOrSecondLast)
        {
            currentCombat.nextTurn();
            return;
        }

        if (shouldClose)
        {
            NotificationUtils.notify(reason);
            return;
        }

        if (this.selectionWindow)
        {
            this.selectionWindow.render();
        }
        else
        {
            this.selectionWindow = new SelectionWindowApplication().render(true, { focus: true });
        }
        this._updateCombatantsData(currentCombat);
    }

    _updateCombatantsData(combat)
    {
        if (this.selectionWindow)
        {
            StoreUpdater.updateCombatants(combat).then(() =>
            {
                const { shouldClose } = ModuleUtils.shouldCloseSelectionWindow(combat);
                if (shouldClose)
                {
                    this.closeSelectionWindow();
                }
            });
        }
    }

    _onHoverToken(token, isHover)
    {
        if (this.selectionWindow)
        {
            if (!svelteGet(isSelectionWindowHovered))
            {
                StoreUpdater.highlightCombatantItem(token, isHover);
            }
        }
    }

    _onRenderCombatTracker(app, html)
    {
        if (svelteGet(overrideEndTurnButton))
        {
            const endTurnButtons = $("a.combat-control", html).filter(`[data-control="nextTurn"]`);
            if (endTurnButtons.length > 0)
            {
                for (let i = 0; i < endTurnButtons.length; ++i)
                {
                    endTurnButtons[i].dataset.control = "popcornInitiativeNextTurn";
                }

                endTurnButtons.click((/* event*/) =>
                {
                    const module = game.modules.get("just-popcorn-initiative");
                    module.api.showSelectionWindowOrPassTurn();
                });
            }
        }
    }
}