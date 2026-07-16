#!/usr/bin/env python3
"""Apply French translations to all affected locale files."""
import json
import os

BASE = "/home/runner/work/Nexior/Nexior/src/i18n/fr"

def load(fname):
    with open(os.path.join(BASE, fname), encoding="utf-8") as f:
        return json.load(f)

def save(fname, data):
    path = os.path.join(BASE, fname)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

def patch(fname, patches_dict):
    """patches_dict: {top_key: {subkey: new_value}} where subkey is 'message' or 'description',
    or {top_key: new_string_value} for flat files."""
    data = load(fname)
    count = 0
    for top_key, val in patches_dict.items():
        if isinstance(val, dict):
            if top_key in data and isinstance(data[top_key], dict):
                for subkey, new_val in val.items():
                    if new_val is not None:  # None means keep as-is
                        data[top_key][subkey] = new_val
                        count += 1
        else:
            if top_key in data:
                data[top_key] = val
                count += 1
    save(fname, data)
    return count

# ─────────────────────────────────────────────────
# application.json (1 issue)
# ─────────────────────────────────────────────────
n = patch("application.json", {
    "badge.shared": {
        "description": "Badge dans la liste des applications indiquant qu'une application a été autorisée à l'utilisateur actuel par quelqu'un d'autre (pas le propriétaire)"
    },
})
print(f"application.json: {n}")

# ─────────────────────────────────────────────────
# connector.json (1 issue — URL placeholder, keep as-is)
# ─────────────────────────────────────────────────
print("connector.json: 0 (URL placeholder intentionally unchanged)")

# ─────────────────────────────────────────────────
# openaiimage.json (1 issue — brand name, keep as-is)
# ─────────────────────────────────────────────────
print("openaiimage.json: 0 (brand name intentionally unchanged)")

# ─────────────────────────────────────────────────
# sora.json (1 issue — brand name, keep as-is)
# ─────────────────────────────────────────────────
print("sora.json: 0 (brand name intentionally unchanged)")

# ─────────────────────────────────────────────────
# grokvideo.json (2 issues)
# ─────────────────────────────────────────────────
n = patch("grokvideo.json", {
    "description.referenceImages": {
        "message": "Images de référence optionnelles pour guider le style ou le contenu de la vidéo générée (grok-imagine-video uniquement)."
    },
    "message.uploadReferenceExceed": {
        "message": "Vous pouvez télécharger jusqu'à 4 images de référence."
    },
})
print(f"grokvideo.json: {n}")

# ─────────────────────────────────────────────────
# maestro.json (2 issues)
# ─────────────────────────────────────────────────
n = patch("maestro.json", {
    "name.additionalLanguages": {
        "message": "Langues supplémentaires (facultatif)"
    },
    "placeholder.additionalLanguages": {
        "message": "Ajouter des langues de sortie"
    },
})
print(f"maestro.json: {n}")

# ─────────────────────────────────────────────────
# nanobanana.json (2 issues — brand/model names, keep as-is)
# ─────────────────────────────────────────────────
print("nanobanana.json: 0 (brand name and model identifier intentionally unchanged)")

# ─────────────────────────────────────────────────
# seedream.json (2 issues)
# ─────────────────────────────────────────────────
n = patch("seedream.json", {
    # model.seedream50pro.message = "doubao-seedream-5.0-pro" → keep as-is (model identifier)
    "model.seedream50pro": {
        "description": "Option du modèle SeeDream 5.0 Pro (image unique phare ; pas de série d'images / streaming / recherche web)"
    },
})
print(f"seedream.json: {n} (model identifier intentionally unchanged)")

# ─────────────────────────────────────────────────
# realtime.json (3 issues — flat string structure)
# ─────────────────────────────────────────────────
n = patch("realtime.json", {
    "listening": "En écoute… commencez à parler",
    "needService": "Activez le service OpenAI dans la console pour utiliser les appels vocaux.",
    "startFailed": "Échec du démarrage de l'appel",
})
print(f"realtime.json: {n}")

# ─────────────────────────────────────────────────
# subsite.json (4 issues)
# ─────────────────────────────────────────────────
n = patch("subsite.json", {
    "button.delete": {
        "description": "Bouton pour supprimer un sous-site"
    },
    "message.deleteConfirm": {
        "description": "Confirmation avant la suppression d'un sous-site"
    },
    "message.deleted": {
        "description": "Message de succès après la suppression d'un sous-site"
    },
    "message.deleteFailed": {
        "description": "Message d'erreur de secours en cas d'échec de la suppression"
    },
})
print(f"subsite.json: {n}")

# ─────────────────────────────────────────────────
# midjourney.json (6 issues — artist/product names, keep as-is)
# ─────────────────────────────────────────────────
print("midjourney.json: 0 (artist names and product names are correct as-is in French)")

# ─────────────────────────────────────────────────
# veo.json (6 issues)
# ─────────────────────────────────────────────────
n = patch("veo.json", {
    # name.veoBot.message = "Google Veo Bot" → keep as-is
    "message.uploadReferencesLimit": {
        "message": "Vous pouvez télécharger au maximum {limit} images",
        "description": "Limite d'images dynamique selon le mode de génération sélectionné"
    },
    "button.actionTabText": {
        "description": "Onglet d'action Veo compact pour la génération vidéo à partir de texte"
    },
    "button.actionTabImage": {
        "description": "Onglet d'action Veo compact pour la génération vidéo à partir d'image"
    },
    "button.actionTabIngredients": {
        "description": "Onglet d'action Veo compact pour la fusion multi-images"
    },
})
print(f"veo.json: {n} (Google Veo Bot brand name intentionally unchanged)")

# ─────────────────────────────────────────────────
# seedance.json (7 issues — all model identifiers, keep as-is)
# ─────────────────────────────────────────────────
print("seedance.json: 0 (all model identifiers intentionally unchanged)")

# ─────────────────────────────────────────────────
# usage.json (11 issues — all descriptions)
# ─────────────────────────────────────────────────
n = patch("usage.json", {
    "field.credential": {
        "description": "La clé API (identifiant) ayant généré cet enregistrement d'utilisation."
    },
    "field.consumed": {
        "description": "En-tête de colonne du tableau de détail d'utilisation pour le total de points consommés par une seule API sur la période sélectionnée."
    },
    "field.share": {
        "description": "En-tête de colonne du tableau de détail d'utilisation pour le pourcentage de consommation d'une API par rapport au total."
    },
    "field.autoRefresh": {
        "description": "Libellé du bouton en haut à droite du tableau d'utilisation ; activé, les enregistrements récents se rafraîchissent automatiquement toutes les quelques secondes."
    },
    "value.processing": {
        "description": "Texte d'espace réservé affiché dans la colonne du code de statut tant qu'une tâche asynchrone n'a pas retourné de code final."
    },
    "value.others": {
        "description": "Nom de la série dans le graphique de tendance d'utilisation regroupant toutes les API autres que les plus consommatrices."
    },
    "title.usageAnalytics": {
        "description": "Titre de la carte d'analyse d'utilisation, comprenant les onglets : tendance, répartition et détail."
    },
    "view.trend": {
        "description": "Bouton de changement de vue dans la carte d'analyse : graphique en barres empilées montrant la consommation de chaque API dans le temps."
    },
    "view.distribution": {
        "description": "Bouton de changement de vue dans la carte d'analyse : graphique en anneau montrant la part de consommation de chaque API."
    },
    "view.breakdown": {
        "description": "Bouton de changement de vue dans la carte d'analyse : tableau listant la consommation exacte et la part de chaque API."
    },
    "message.exportFailed": {
        "description": "Message d'erreur affiché lorsque la demande d'export CSV échoue (erreur réseau ou serveur)."
    },
})
print(f"usage.json: {n}")

# ─────────────────────────────────────────────────
# webextrator.json (11 issues)
# ─────────────────────────────────────────────────
n = patch("webextrator.json", {
    "name.waitForSelector": {
        "message": "Attendre le sélecteur"
    },
    # placeholder.url.message = "https://example.com" → keep as-is (URL example)
    "placeholder.waitForSelector": {
        "message": "Sélecteur CSS, ex. .article-body"
    },
    "placeholder.blockResources": {
        "message": "Types de ressources à bloquer"
    },
    "description.intro": {
        "message": "Rendre et extraire n'importe quelle page web"
    },
    "description.introHint": {
        "message": "Saisissez une URL et choisissez Extraire ou Rendre pour obtenir du contenu propre, du Markdown, des liens, des captures d'écran, et plus encore."
    },
    "description.enableLlm": {
        "message": "Utilisez un LLM pour nettoyer et structurer le contenu extrait. Consomme des crédits supplémentaires."
    },
    "message.running": {
        "message": "Traitement en cours…"
    },
    "message.usedUp": {
        "message": "Votre quota est épuisé. Veuillez recharger pour continuer."
    },
    "message.busy": {
        "message": "Le service est occupé. Veuillez réessayer dans un moment."
    },
    "message.timeout": {
        "message": "La page a mis trop de temps à charger. Essayez une autre URL ou augmentez le délai d'attente."
    },
})
print(f"webextrator.json: {n} (URL placeholder intentionally unchanged)")

# ─────────────────────────────────────────────────
# digitalhuman.json (12 issues)
# ─────────────────────────────────────────────────
n = patch("digitalhuman.json", {
    "placeholder.text": {
        "message": "Saisissez ce que l'avatar doit dire…"
    },
    "description.face": {
        "message": "Téléchargez une vidéo de face claire (recommandé) ou une photo pour animer le personnage numérique parlant."
    },
    "description.voiceClone": {
        "message": "Téléchargez un échantillon vocal propre de 10 à 20 s pour cloner une voix, puis réutilisez-la pour lire votre texte."
    },
    "button.uploadVideo": {
        "message": "Télécharger la vidéo de visage"
    },
    "button.uploadPhoto": {
        "message": "Télécharger la photo de visage"
    },
    "message.startingTask": {
        "message": "Soumission de votre tâche vidéo…"
    },
    "message.startTaskSuccess": {
        "message": "Tâche soumise ! Elle apparaîtra ci-dessous pendant le rendu."
    },
    "message.startTaskFailed": {
        "message": "Échec de la soumission de la tâche. Veuillez réessayer."
    },
    "message.usedUp": {
        "message": "Votre solde est insuffisant pour cette demande."
    },
    "message.uploadError": {
        "message": "Téléchargement échoué. Veuillez réessayer."
    },
    "message.voiceCloneSuccess": {
        "message": "Voix clonée ! Vous pouvez maintenant générer avec votre texte."
    },
    "message.voiceCloneFailed": {
        "message": "Clonage de la voix échoué. Essayez un échantillon plus propre."
    },
})
print(f"digitalhuman.json: {n}")

# ─────────────────────────────────────────────────
# omni.json (17 issues)
# ─────────────────────────────────────────────────
n = patch("omni.json", {
    "message.uploadReferenceExceed": {
        "message": "Vous pouvez télécharger jusqu'à 4 images de référence."
    },
    "name.referenceVideo": {
        "description": "Vidéo de référence/modifiable pour l'édition vidéo Omni"
    },
    "description.referenceVideo": {
        "message": "MP4/MOV optionnel (≤200 Mo) pour modifier ou référencer une vidéo existante. Nécessite au moins une image de référence.",
        "description": "Texte d'aide pour le téléchargeur de vidéo de référence"
    },
    "button.uploadVideo": {
        "description": "Bouton pour télécharger la vidéo de référence"
    },
    "message.uploadVideoExceed": {
        "message": "Vous pouvez télécharger au maximum 1 vidéo de référence",
        "description": "Erreur lorsque plus d'une vidéo de référence est téléchargée"
    },
    "message.uploadVideoError": {
        "message": "Échec du téléchargement de la vidéo de référence, veuillez réessayer ultérieurement",
        "description": "Erreur lorsque le téléchargement de la vidéo de référence échoue"
    },
    "message.uploadVideoTypeFailed": {
        "message": "Le fichier téléchargé doit être au format MP4 ou MOV !",
        "description": "Erreur lorsque la vidéo de référence n'est pas au format MP4/MOV"
    },
    "message.uploadVideoSizeExceed": {
        "message": "La taille du fichier téléchargé ne peut pas dépasser 200 Mo !",
        "description": "Erreur lorsque la vidéo de référence dépasse 200 Mo"
    },
    "message.promptRequired": {
        "message": "Veuillez saisir un prompt.",
        "description": "Validation lorsque le prompt est vide"
    },
    "message.videoRequiresImage": {
        "message": "Veuillez ajouter au moins une image de référence lors de l'utilisation d'une vidéo de référence.",
        "description": "Validation lorsque video_urls n'a pas d'image de référence"
    },
})
print(f"omni.json: {n}")

# ─────────────────────────────────────────────────
# order.json (18 issues)
# ─────────────────────────────────────────────────
n = patch("order.json", {
    "message.wechatPayMobileGuide": {
        "message": "Les navigateurs mobiles ne peuvent pas ouvrir WeChat Pay directement. Copiez le lien de paiement ci-dessous et ouvrez-le dans WeChat pour finaliser votre paiement.",
        "description": "Guide affiché aux utilisateurs sur un navigateur mobile hors de WeChat, où WeChat Pay H5 n'est pas disponible."
    },
    "button.copyPayLink": {
        "message": "Copier le lien de paiement",
        "description": "Libellé du bouton qui copie l'URL de la page actuelle pour que l'utilisateur puisse la coller dans WeChat."
    },
    "message.wechatPayMobileHint": {
        "message": "Après avoir copié, ouvrez WeChat, collez le lien dans n'importe quelle conversation ou la barre de recherche, puis appuyez dessus pour finaliser le paiement.",
        "description": "Indication secondaire affichée sous le bouton de copie du lien pour guider les utilisateurs à coller le lien dans WeChat."
    },
    "message.applePayProcessing": {
        "description": "Message affiché pendant le traitement de l'achat intégré Apple."
    },
    "message.applePayFailed": {
        "description": "Message affiché lorsque l'achat intégré Apple échoue."
    },
    "message.applePayUnavailable": {
        "description": "Message affiché lorsque l'achat intégré Apple n'est pas disponible pour ce forfait."
    },
    "message.wechatPayLongPressTip": {
        "description": "Indication affichée au-dessus du QR code natif dans WeChat mobile. L'utilisateur maintient l'appui pour reconnaître le lien profond `weixin://wxpay`."
    },
    "title.totalOrders": {
        "description": "Carte récapitulative : nombre total de commandes correspondant aux filtres actuels."
    },
    "title.totalSpent": {
        "description": "Carte récapitulative : montant total dépensé sur les commandes correspondantes."
    },
    "title.finishedOrders": {
        "description": "Carte récapitulative : nombre de commandes terminées."
    },
    "title.pendingOrders": {
        "description": "Carte récapitulative : nombre de commandes en attente."
    },
    "button.export": {
        "description": "Libellé du bouton pour exporter les commandes filtrées en CSV."
    },
    "field.allStates": {
        "description": "Texte d'espace réservé du menu déroulant de filtre d'état : aucun état spécifique sélectionné."
    },
    "field.allPayWays": {
        "message": "Tous les modes de paiement",
        "description": "Texte d'espace réservé du menu déroulant de filtre de mode de paiement : aucune méthode spécifique sélectionnée."
    },
})
print(f"order.json: {n}")

# ─────────────────────────────────────────────────
# pika.json (50 issues — all IS_CHINESE descriptions)
# ─────────────────────────────────────────────────
n = patch("pika.json", {
    "style.effect1": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect2": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect3": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect4": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect5": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect6": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect7": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect8": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect9": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect10": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect11": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect12": {"description": "Nom de l'effet vidéo dans Pika"},
    "style.effect13": {"description": "Nom de l'effet vidéo dans Pika"},
    "name.taskId": {"description": "Identifiant de la tâche"},
    "name.type": {"description": "Type de contenu de la vidéo Pika à générer, tel que 'lien', 'texte', etc."},
    "name.failure": {"description": "Statut d'échec de la tâche"},
    "name.failureReason": {"description": "Raison de l'échec de la tâche"},
    "name.status": {"description": "Statut de la tâche"},
    "name.traceId": {"description": "Identifiant de traçage de la tâche"},
    "name.elapsed": {"description": "Durée de la tâche (en secondes)"},
    "name.createdAt": {"description": "Date et heure de génération de la vidéo Pika"},
    "name.imageUrl": {"description": "Image de référence pour la vidéo à générer"},
    "name.videoUrl": {"description": "Vidéo personnalisée"},
    "name.prompt": {"description": "Prompt pour la saisie du contenu"},
    "name.ingredients": {"description": "Bouton/libellé pour créer des vidéos à partir de plusieurs images (garder court)"},
    "name.model": {"description": "Version du modèle utilisée pour générer la vidéo"},
    "name.effect": {"description": "Nom du paramètre de style pour basculer entre différentes versions ou styles de modèles"},
    "name.ingredientsModel": {"description": "Version du modèle utilisée pour générer la vidéo"},
    "name.pikaBot": {"description": "Nom du générateur de vidéos Pika"},
    "description.ingredients": {"description": "Description du paramètre 'ingredients'"},
    "description.imageUrl": {"description": "Description du paramètre 'imageUrl'"},
    "description.prompt": {"description": "Description du paramètre 'prompt'"},
    "status.pending": {"description": "Statut d'attente de la tâche"},
    "status.processing": {"description": "Statut de traitement de la tâche"},
    "placeholder.paddingNoise": {"description": "Espace réservé pour la saisie du bruit de rembourrage"},
    "placeholder.select": {"description": "Texte d'espace réservé dans le champ de sélection"},
    "placeholder.paddingLevel": {"description": "Espace réservé pour le niveau de rembourrage"},
    "placeholder.prompt": {"description": "Texte d'espace réservé dans le champ de prompt"},
    "placeholder.position": {"description": "Espace réservé pour la saisie de la position"},
    "placeholder.aspectRatio": {"description": "Espace réservé pour le ratio d'aspect"},
    "placeholder.preset": {"description": "Espace réservé pour le préréglage"},
    "placeholder.markerShape": {"description": "Espace réservé pour la forme du marqueur"},
    "placeholder.rotate": {"description": "Espace réservé pour la saisie de la rotation"},
    "placeholder.subMarker": {"description": "Espace réservé pour le sous-marqueur"},
    "button.precise": {"description": "Texte du bouton pour générer une vidéo Pika"},
    "button.creative": {"description": "Texte du bouton pour générer une vidéo Pika"},
    "button.generate": {"description": "Texte du bouton pour générer une vidéo Pika"},
    "button.extend": {"description": "Texte du bouton pour prolonger une vidéo"},
    "button.download": {"description": "Texte du bouton pour télécharger une vidéo"},
    "button.uploadImageUrl": {"description": "Texte du bouton pour télécharger des images (simplifié en 'Télécharger')"},
})
print(f"pika.json: {n}")

print("\nDone with smaller files.")

# ─────────────────────────────────────────────────
# chat.json (53 issues)
# ─────────────────────────────────────────────────
n = patch("chat.json", {
    "scheduledTasks.empty": {
        "message": "Aucune tâche planifiée. Cliquez sur « Nouveau » pour en créer une."
    },
    "scheduledTasks.noRuns": {
        "message": "Aucune exécution"
    },
    "scheduledTasks.loadError": {
        "message": "Échec du chargement"
    },
    "scheduledTasks.deleteConfirm": {
        "message": "Supprimer « {name} » ? La tâche cessera de s'exécuter."
    },
    "scheduledTasks.triggerNow": {
        "description": "Déclencher la tâche immédiatement, hors planning"
    },
    "scheduledTasks.triggerSuccess": {
        "message": "Déclenché. Le résultat apparaîtra dans l'historique d'exécution sous peu.",
        "description": "Succès du déclenchement manuel"
    },
    "scheduledTasks.triggerError": {
        "message": "Échec du déclenchement. Veuillez réessayer ultérieurement.",
        "description": "Erreur de déclenchement manuel"
    },
    "scheduledTasks.runCount": {
        "message": "Exécuté {count} fois"
    },
    "scheduledTasks.scheduleType.interval": {
        "description": "Exécuter à intervalles fixes"
    },
    "scheduledTasks.form.intervalUnit.minute": {
        "description": "Unité d'intervalle : minutes"
    },
    "scheduledTasks.form.intervalUnit.hour": {
        "description": "Unité d'intervalle : heures"
    },
    "scheduledTasks.form.intervalUnit.day": {
        "description": "Unité d'intervalle : jours"
    },
    "scheduledTasks.form.hourlyMinute": {
        "description": "À quelle minute de chaque heure exécuter"
    },
    "scheduledTasks.form.hourlyMinuteHint": {
        "message": "À quelle minute de chaque heure exécuter (0–59)",
        "description": "Indication sur la minute d'exécution horaire"
    },
    "scheduledTasks.form.intervalHint": {
        "message": "S'exécute une fois à intervalle fixe après l'exécution précédente (minimum 1 minute)"
    },
    "scheduledTasks.form.cronHint": {
        "message": "Expression cron standard à 5 champs : minute heure jour mois jour-de-semaine"
    },
    "scheduledTasks.humanize.everyNMinutes": {
        "message": "toutes les {n} min",
        "description": "Lisible : toutes les N minutes"
    },
    "scheduledTasks.humanize.everyNHours": {
        "message": "toutes les {n} h",
        "description": "Lisible : toutes les N heures"
    },
    "scheduledTasks.humanize.everyNDays": {
        "message": "tous les {n} j",
        "description": "Lisible : tous les N jours"
    },
    "scheduledTasks.humanize.hourlyAtMinute": {
        "message": "horaire à la minute {n}",
        "description": "Lisible : horaire à la minute N"
    },
    "scheduledTasks.humanize.dailyAt": {
        "message": "quotidiennement à {time}",
        "description": "Lisible : quotidiennement à l'heure"
    },
    "scheduledTasks.humanize.weeklyAt": {
        "message": "{weekday} à {time}",
        "description": "Lisible : hebdomadaire au jour/heure"
    },
    "scheduledTasks.humanize.cronRaw": {
        "description": "Lisible : cron brut"
    },
    "scheduledTasks.humanize.once": {
        "message": "une fois à {time}",
        "description": "Lisible : une fois"
    },
    "scheduledTasks.form.namePlaceholder": {
        "message": "ex. Résumé quotidien des actualités"
    },
    "scheduledTasks.form.promptPlaceholder": {
        "message": "Saisissez votre question ou instruction planifiée. Prend en charge les variables {'{{date}}'}, {'{{run_count}}'}, {'{{last_output}}'}."
    },
    "scheduledTasks.form.skillNotActiveTitle": {
        "message": "Liez d'abord la compétence"
    },
    "scheduledTasks.form.skillNotActiveMessage": {
        "message": "La compétence « {name} » n'est pas encore liée ou active dans votre compte. Sans liaison, la tâche planifiée pourrait ne pas pouvoir l'utiliser lors des exécutions en arrière-plan sans surveillance. Nous recommandons de la lier d'abord, ou vous pouvez enregistrer quand même."
    },
    "scheduledTasks.form.required": {
        "message": "Veuillez remplir le nom de la tâche et le prompt"
    },
    "artifacts.unhide": {
        "description": "Restaurer un artefact masqué"
    },
    "artifacts.showHidden": {
        "description": "Bouton dans la barre de filtres pour inclure les artefacts masqués"
    },
    "artifacts.hiddenBadge": {
        "description": "Badge affiché sur les artefacts actuellement masqués"
    },
    "browserTool.title": {
        "description": "Titre par défaut pour une activité de l'outil BrowserDevice"
    },
    "browserTool.state.choose_device": {
        "message": "Choisissez un appareil navigateur"
    },
    "browserTool.state.device_offline": {
        "message": "L'appareil navigateur est hors ligne"
    },
    "browserTool.state.awaiting_device": {
        "message": "En attente de l'appareil navigateur"
    },
    "browserTool.state.awaiting_local_approval": {
        "message": "En attente d'approbation sur l'appareil navigateur"
    },
    "browserTool.state.takeover_required": {
        "message": "Reprise requise sur l'appareil navigateur"
    },
    "browserTool.state.executing": {
        "message": "Exécution dans le navigateur"
    },
    "browserTool.state.denied": {
        "message": "Refusé sur l'appareil navigateur"
    },
    "browserTool.state.expired": {
        "message": "Requête navigateur expirée"
    },
    "browserTool.state.cancel_too_late": {
        "message": "Annulation impossible"
    },
    "scheduledTasks.run.waiting_for_device": {
        "message": "En attente de l'appareil navigateur"
    },
})
print(f"chat.json: {n}")


# ─────────────────────────────────────────────────
# codingBridge.json (81 issues)
# ─────────────────────────────────────────────────
n = patch("codingBridge.json", {
    "nodeList.title": {"description": "Titre de la liste des appareils Coding Bridge"},
    "nodeList.refresh": {"description": "Actualiser la liste des appareils"},
    "nodeList.pair": {"description": "Ouvrir la boîte de dialogue de jumelage"},
    "nodeList.empty": {
        "message": "Aucun appareil jumelé.",
        "description": "Message affiché quand la liste des appareils est vide"
    },
    "nodeList.pairFirst": {
        "message": "Jumelez votre premier appareil",
        "description": "Bouton de jumelage dans l'état vide"
    },
    "nodeList.remove": {"description": "Retirer un appareil"},
    "nodeList.removeConfirm": {
        "message": "Retirer l'appareil « {name} » ? Il devra être jumelé à nouveau.",
        "description": "Confirmation de suppression d'appareil"
    },
    "nodeList.removeSuccess": {"description": "Notification de suppression d'appareil réussie"},
    "nodeList.removeFailed": {
        "message": "Échec de la suppression de l'appareil.",
        "description": "Notification d'erreur de suppression d'appareil"
    },
    "status.online": {"description": "Statut de l'appareil : en ligne"},
    "status.offline": {"description": "Statut de l'appareil : hors ligne"},
    "connection.disconnected": {"description": "Connexion relais déconnectée"},
    "connection.connecting": {"description": "Connexion relais en cours"},
    "connection.connected": {"description": "Connexion relais établie"},
    "connection.error": {"description": "Erreur de connexion relais"},
    "pair.title": {
        "message": "Jumeler un appareil",
        "description": "Titre de la boîte de dialogue de jumelage"
    },
    "pair.intro": {
        "message": "Exécutez l'agent Coding Bridge sur votre ordinateur, puis entrez son code de jumelage ici pour le contrôler.",
        "description": "Introduction de la boîte de dialogue de jumelage"
    },
    "pair.step1": {"message": "Installez l'agent (nécessite Python 3.10+) :"},
    "pair.step2": {"message": "Démarrez-le et suivez l'invite :"},
    "pair.step3": {"message": "Entrez le code de jumelage affiché ci-dessous."},
    "pair.codePlaceholder": {"description": "Espace réservé pour la saisie du code de jumelage"},
    "pair.claim": {"description": "Bouton de confirmation du jumelage"},
    "pair.success": {
        "message": "Appareil « {name} » jumelé.",
        "description": "Notification de succès du jumelage"
    },
    "pair.invalidCode": {
        "message": "Code de jumelage invalide ou expiré.",
        "description": "Erreur de code de jumelage invalide"
    },
    "pair.usedCode": {
        "message": "Ce code de jumelage a déjà été utilisé.",
        "description": "Erreur de code de jumelage déjà utilisé"
    },
    "pair.failed": {
        "message": "Échec du jumelage de l'appareil.",
        "description": "Erreur générique de jumelage"
    },
    "permission.title": {"description": "Titre de la boîte de dialogue d'autorisation"},
    "permission.subtitle": {
        "message": "L'agent souhaite utiliser un outil. Approuvez pour continuer.",
        "description": "Sous-titre de la boîte de dialogue d'autorisation"
    },
    "permission.deny": {"description": "Refuser une autorisation d'outil"},
    "permission.allow": {"description": "Accorder une autorisation d'outil"},
    "session.noDevice": {
        "message": "Sélectionnez un appareil pour commencer à coder.",
        "description": "Espace réservé quand aucun appareil n'est sélectionné"
    },
    "session.newSession": {"description": "Démarrer une nouvelle session"},
    "session.deviceOffline": {
        "message": "Cet appareil est hors ligne. Démarrez l'agent Coding Bridge dessus pour continuer.",
        "description": "Avertissement appareil hors ligne"
    },
    "session.nodeId": {"description": "Libellé de diagnostic pour l'identifiant de nœud"},
    "session.sessionId": {"description": "Libellé de diagnostic pour l'identifiant de session"},
    "session.traceId": {"description": "Libellé de diagnostic pour l'identifiant de trace"},
    "session.startHint": {
        "message": "Envoyez un message pour démarrer une session sur cet appareil.",
        "description": "Indication pour le transcript vide"
    },
    "session.cwdPlaceholder": {
        "message": "Répertoire de travail (facultatif)",
        "description": "Espace réservé pour la saisie du répertoire de travail"
    },
    "session.modelPlaceholder": {"description": "Espace réservé pour la saisie du modèle"},
    "session.promptPlaceholder": {
        "message": "Envoyez un message à l'agent…",
        "description": "Espace réservé pour la saisie du prompt"
    },
    "session.send": {"description": "Bouton d'envoi du prompt"},
    "session.retry": {"description": "Relancer le dernier prompt après un échec"},
    "session.editPrompt": {"description": "Modifier un prompt envoyé et le renvoyer comme nouveau tour"},
    "session.editingBanner": {
        "message": "Modification — l'envoi rembobine la conversation jusqu'à ce point."
    },
    "session.editRestoreCode": {"message": "Restaurer aussi le code"},
    "session.enterHint": {
        "message": "Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne.",
        "description": "Indication clavier du compositeur"
    },
    "transcript.turnFailed": {"description": "Libellé du résultat du tour : échec"},
    "transcript.turnDone": {"description": "Libellé du résultat du tour : terminé"},
    "history.button": {"description": "Ouvrir le tiroir de l'historique des conversations"},
    "history.title": {"description": "Titre du tiroir d'historique"},
    "history.intro": {"description": "Introduction du tiroir d'historique"},
    "history.refresh": {"description": "Recharger la liste d'historique"},
    "history.loading": {"description": "Message de chargement de l'historique"},
    "history.empty": {"description": "Message quand l'historique est vide"},
    "history.messages": {"description": "Nombre de messages d'un élément d'historique"},
    "history.readonly": {"description": "Avis de relecture en lecture seule"},
    "history.running": {"description": "Indique une conversation d'historique actuellement active sur l'appareil"},
    "history.resumeHint": {"description": "Indication pour reprendre le compositeur"},
    "history.claudeLabel": {"description": "Libellé de session Claude rejouée"},
    "history.codexLabel": {"description": "Libellé de session Codex rejouée"},
    "session.settingsLocked": {"message": "Les paramètres sont verrouillés pour cette session"},
    "session.attachmentTooLarge": {"message": "Fichier trop volumineux ; gardez chaque fichier sous 50 Mo."},
    "session.attachmentLimit": {"message": "Vous pouvez joindre jusqu'à {count} fichiers."},
    "session.attachmentUploadError": {"message": "Échec du téléchargement de la pièce jointe."},
})
print(f"codingBridge.json: {n}")


# ─────────────────────────────────────────────────
# kling.json (59 issues)
# ─────────────────────────────────────────────────
n = patch("kling.json", {
    "tab.videoGeneration": {"description": "Libellé d'onglet : Génération de vidéo"},
    "tab.motionControl": {"description": "Libellé d'onglet : Contrôle de mouvement"},
    "name.motionImage": {"description": "Entrée d'image de personnage dans le Contrôle de mouvement"},
    "name.motionVideo": {"description": "Entrée de vidéo de référence dans le Contrôle de mouvement"},
    "name.motionPrompt": {"description": "Prompt supplémentaire dans le Contrôle de mouvement"},
    "name.characterOrientation": {"description": "Champ d'orientation du personnage"},
    "name.orientationImage": {"description": "Option d'orientation du personnage : Suivre l'image"},
    "name.orientationVideo": {"description": "Option d'orientation du personnage : Suivre la vidéo"},
    "name.keepOriginalSound": {"description": "Bouton keep_original_sound"},
    "description.motionImage": {"description": "Description de motion image_url"},
    "description.motionVideo": {"description": "Description de motion video_url"},
    "description.motionPrompt": {"description": "Description du prompt de mouvement"},
    "description.characterOrientation": {"description": "Description de character_orientation"},
    "description.motionMode": {"description": "Description du mode de mouvement"},
    "description.motionModel": {"description": "Description de la version du modèle de mouvement"},
    "description.keepOriginalSound": {"description": "Description de keep_original_sound"},
    "placeholder.motionPrompt": {"description": "Espace réservé pour le prompt de mouvement"},
    "button.generateMotion": {"description": "Bouton de génération du Contrôle de mouvement"},
    "message.motionMissingInputs": {"description": "Avertissement quand les entrées sont manquantes dans le Contrôle de mouvement"},
    "message.motionPricingNote": {"description": "Explique que le Contrôle de mouvement est facturé à la seconde"},
    "inspiration.title": {"description": "Titre du tiroir Inspiration"},
    "inspiration.openButton": {"description": "Bouton pour ouvrir le tiroir Inspiration"},
    "inspiration.removeChip": {"description": "aria-label du bouton pour retirer un préréglage sélectionné dans la zone de prompt"},
    "inspiration.hint": {"description": "Instructions d'utilisation en haut du tiroir Inspiration"},
    "inspiration.empty": {"description": "État vide du tiroir Inspiration"},
    "inspiration.selectedSummary": {"description": "Nombre de préréglages sélectionnés"},
    "inspiration.clearSelected": {"description": "Bouton pour effacer tous les préréglages sélectionnés"},
    "inspiration.group.cameraMovements": {"description": "Groupe Inspiration : Mouvements de caméra"},
    "inspiration.group.cameraSpeed": {"description": "Groupe Inspiration : Vitesse de mouvement"},
    "inspiration.group.shotType": {"description": "Groupe Inspiration : Type de plan / Perspective"},
    "inspiration.group.light": {"description": "Groupe Inspiration : Éclairage"},
    "inspiration.group.frame": {"description": "Groupe Inspiration : Cadrage / Composition"},
    "inspiration.group.atmosphere": {"description": "Groupe Inspiration : Atmosphère / Style"},
    "name.motionModel": {"description": "Version du modèle Kling utilisée pour le contrôle de mouvement"},
    "tab.talkingPhoto": {"description": "Libellé d'onglet : Photo parlante"},
    "name.talkingPhotoImage": {"description": "Entrée d'image portrait pour Photo parlante"},
    "name.talkingPhotoAudio": {"description": "Entrée audio de pilotage pour Photo parlante"},
    "name.talkingPhotoPrompt": {"description": "Prompt de mouvement optionnel pour Photo parlante"},
    "description.talkingPhotoImage": {"description": "Texte d'aide pour l'image portrait de Photo parlante"},
    "description.talkingPhotoAudio": {"description": "Texte d'aide pour l'audio de pilotage de Photo parlante"},
    "description.talkingPhotoPrompt": {"description": "Texte d'aide pour le prompt de mouvement de Photo parlante"},
    "placeholder.talkingPhotoPrompt": {"description": "Espace réservé pour la saisie du prompt de Photo parlante"},
    "button.generateTalkingPhoto": {"description": "Bouton de génération de Photo parlante"},
    "button.uploadAudio": {"description": "Bouton de téléchargement audio pour Photo parlante"},
    "message.talkingPhotoMissingInputs": {"description": "Avertissement quand les entrées de Photo parlante sont manquantes"},
    "message.uploadAudioExceed": {"description": "Avertissement de limite du nombre de fichiers audio pour Photo parlante"},
    "message.uploadAudioError": {"description": "Erreur de téléchargement audio pour Photo parlante"},
    "name.referenceVideo": {"description": "Libellé du champ : vidéo de référence/modifiable pour l'édition vidéo Omni"},
    "description.referenceVideo": {
        "message": "Uniquement pour kling-video-o1. Téléchargez un MP4/MOV (720-2160 px, 3-10 s, ≤200 Mo) pour modifier ou référencer.",
        "description": "Texte d'aide pour le téléchargeur de vidéo de référence"
    },
    "button.uploadReferenceVideo": {"description": "Bouton pour télécharger la vidéo de référence"},
    "message.referenceVideoExceed": {
        "message": "Vous pouvez télécharger au maximum 1 vidéo de référence",
        "description": "Erreur lorsque plus d'une vidéo de référence est téléchargée"
    },
    "message.referenceVideoError": {
        "message": "Échec du téléchargement de la vidéo de référence, veuillez réessayer ultérieurement",
        "description": "Erreur lorsque le téléchargement de la vidéo de référence échoue"
    },
    "message.referenceVideoTypeFailed": {
        "message": "Le fichier téléchargé doit être au format MP4 ou MOV !",
        "description": "Erreur lorsque la vidéo de référence n'est pas au format MP4/MOV"
    },
    "message.referenceVideoSizeExceed": {
        "message": "La taille du fichier téléchargé ne peut pas dépasser 200 Mo !",
        "description": "Erreur lorsque la vidéo de référence dépasse 200 Mo"
    },
})
print(f"kling.json: {n}")

