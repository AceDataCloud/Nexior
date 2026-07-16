import json
from collections import OrderedDict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

# ─── COMMON.JSON translations ───────────────────────────────────────────────
common_translations = {
    # Chinese descriptions → Finnish
    ('nav.seedance', 'description'): "Sivuston navigointipalkin teksti SeeDance-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'SeeDance'-muodossa",
    ('nav.luma', 'description'): "Sivuston navigointipalkin teksti Luma-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Luma'-muodossa",
    ('nav.pika', 'description'): "Sivuston navigointipalkin teksti Pika-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Pika'-muodossa",
    ('nav.kling', 'description'): "Sivuston navigointipalkin teksti Kling-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Kling'-muodossa",
    ('nav.hailuo', 'description'): "Sivuston navigointipalkin teksti Hailuo-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Hailuo'-muodossa",
    ('nav.wan', 'description'): "Sivuston navigointipalkin teksti Wan-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Wan'-muodossa",
    ('nav.producer', 'description'): "Sivuston navigointipalkin teksti Producer-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Producer'-muodossa",
    ('nav.kimi', 'description'): "Sivuston navigointipalkin teksti Kimi-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'Kimi'-muodossa",
    ('nav.serp', 'description'): "Sivuston navigointipalkin teksti SERP-sivulle, älä käännä tätä kenttää, sen täytyy pysyä 'SERP'-muodossa",
    ('nav.image', 'description'): "Sivuston navigointipalkin teksti kuvaussivulle",
    ('nav.music', 'description'): "Sivuston navigointipalkin teksti musiikkisivulle",
    ('nav.video', 'description'): "Sivuston navigointipalkin teksti videosivulle",
    ('nav.distribution', 'description'): "Sivuston navigointipalkin teksti suositustulosivulle",
    ('nav.connections', 'description'): "Valikkokohde siirtymiseen auth.acedata.cloud-yhteyksien hallintasivulle",
    ('nav.logOut', 'description'): "Sivuston navigointipalkin teksti kirjautumisesta poistumiseen",
    ('nav.site', 'description'): "Sivuston navigointipalkin teksti sivuston asetussivulle",
    ('nav.subsite', 'description'): 'Sivupaneelin "Oma alisivusto" -kohde, näytetään vain kun features.subsite on käytössä',
    ('nav.setting', 'description'): "Sivuston navigointipalkin teksti asetussivulle",
    ('nav.more', 'description'): "Sivuston navigointipalkin teksti lisäpalveluiden laajentamiseen",
    ('nav.locale', 'description'): "Sivuston navigointipalkin teksti kielen vaihtamiseen",
    ('nav.support', 'description'): "Sivuston navigointipalkin teksti asiakastukisivulle",
    ('nav.darkMode', 'description'): "Sivuston navigointipalkin teksti tummaan teemaan vaihtamiseen",
    ('title.alert', 'description'): "Varoitusviestin otsikko",
    ('title.placeholderOfSelect', 'description'): "Valintasyötteen paikkamerkki",
    ('title.placeholderOfInput', 'description'): "Syötekentän paikkamerkki",
    ('title.allApplications', 'description'): "Kaikkien hakemusten sivun otsikko",
    ('title.allOrders', 'description'): "Kaikkien tilausten sivun otsikko",
    ('title.orderInfo', 'description'): "Tilaustietojen sivun otsikko",
    ('title.buyMore', 'description'): "Sivun otsikko saldon lataukselle. Suomeksi 'Lataa saldoa'.",
    ('title.distribution', 'description'): "Suositustulojen sivun otsikko; käyttäjä voi ansaita rahaa kutsumalla muita palveluun",
    ('title.site', 'description'): "Sivuston asetusten sivun otsikko",
    ('title.distributionHistory', 'description'): "Suositushistorian sivun otsikko",
    ('title.invitee', 'description'): "Kutsutun henkilön sivun otsikko",
    ('title.allUsages', 'description'): "API-palvelun kaikkien käyttökertojen sivun otsikko",
    ('title.allCredentials', 'description'): "Kaikkien tunnisteiden sivun otsikko; tunnisteet antavat pääsyn API:hin",

    # English-copy descriptions → Finnish
    ('button.deletePermanently', 'description'): "Poistovahvistusdialogissa alhaalla oleva punainen poistopainike",
    ('button.downloadWindows', 'description'): "Painikkeen teksti Windows-työpöytäasennusohjelman lataamiseen",
    ('button.downloadMac', 'description'): "Painikkeen teksti macOS-työpöytäasennusohjelman lataamiseen",
    ('error.loginLinkExpired', 'message'): "Kirjautumislinkki vanhentunut. Kirjaudu uudelleen sisään.",
    ('error.loginLinkExpired', 'description'): "Näytetään työpöytäsovelluksessa, kun OAuth-takaisinkutsu epäonnistuu (tilakonflikti tai vanhentunut).",
    ('message.guestTasks', 'description'): "Kehote tehtävälistassa kirjautumattomille vieraille",
    ('message.mobileComingSoon', 'description'): "Lyhyt tilaetiketti alustakortissa (esim. iOS), kun sovellus on valmisteilla",
    ('message.mobileNowOnAppStore', 'message'): "Nyt App Storessa",
    ('message.mobileNowOnAppStore', 'description'): "Tilaetiketti iOS-kortissa, kun sovellus on saatavilla App Storessa",
    ('message.desktopWindowsHint', 'description'): "Windows-työpöytälatauskortin kuvaus",
    ('message.desktopMacHint', 'description'): "macOS-työpöytälatauskortin kuvaus",
    ('message.desktopUnsignedNote', 'description'): "Huomio, joka selittää, että työpöytäversiot ovat allekirjoittamattomia beta-versioita ja miten ne avataan",
    ('button.getOnGooglePlay', 'description'): "Painikkeen teksti, joka avaa sovelluksen Google Play -kauppasivun",
    ('button.getOnAppStore', 'message'): "Lataa App Storesta",
    ('button.getOnAppStore', 'description'): "Painikkeen teksti, joka avaa sovelluksen Apple App Store -kauppasivun",
    ('message.mobileApkFallback', 'description'): "Näytetään toissijaisen painikkeen vieressä, joka tarjoaa suoran APK-latauksen käyttäjille, joilla ei ole pääsyä Google Playhin",
    ('message.mobilePlayStoreHint', 'description'): "Ohje QR-koodin alla, joka selittää, että skannaaminen avaa Google Play -listauksen",
    ('message.mobileAppStoreHint', 'message'): "Skannaa avataksesi App Storen",
    ('message.mobileAppStoreHint', 'description'): "Ohje QR-koodin alla, joka selittää, että skannaaminen avaa App Store -listauksen",
    ('message.deleteAccountConfirm', 'description'): "Vahvistusviesti, joka näytetään ennen käyttäjätilin pysyvää poistamista",
    ('message.deleteAccountSuccess', 'description'): "Viesti, joka näytetään käyttäjätilin onnistuneen poistamisen jälkeen",
    ('message.deleteAccountFailed', 'description'): "Viesti, joka näytetään, kun tilin poistaminen epäonnistuu",
    ('message.deleteAccountWarning', 'description'): "Punainen varoitusbanneri poistovahvistusdialogissa ylhäällä",
    ('message.deleteAccountConsequences', 'description'): "Selittää, mitä tietoja poistetaan poistovahvistusdialogissa",
    ('message.deleteAccountTypePrompt', 'description'): "Ohjaa käyttäjää kirjoittamaan käyttäjänimensä vahvistamiseksi; käyttäjänimi näytetään erikseen alla",
    ('message.deleteAccountPlaceholder', 'description'): "Käyttäjänimen vahvistussyötteen paikkamerkki",
    ('nav.grokvideo', 'description'): "Sivuston navigointipalkin teksti Grok Video -sivulle",
    ('nav.codingBridge', 'description'): "Sivuston navigointipalkin teksti Coding Bridge -sivulle, pysyy muodossa 'Coding Bridge'",
    ('nav.webextrator', 'description'): "Sivuston navigointipalkin teksti WebExtrator-sivulle, pysyy muodossa 'WebExtrator'",
    ('nav.deleteAccount', 'description'): "Valikkokohde nykyisen käyttäjätilin pysyvään poistamiseen",
    ('settings.sendShortcut', 'description'): "Asetuspaneelin viestin lähetyspikakomennon otsikko: valitse Enter tai modifier+Enter lähettämiseen",
    ('sendShortcut.enter', 'description'): "Lähetyspikakomennon vaihtoehto: paina Enter lähettääksesi viestin",
    ('sendShortcut.modEnter', 'description'): "Lähetyspikakomennon vaihtoehto: paina modifier-näppäintä (⌘ tai Ctrl) + Enter lähettääksesi. {key} on modifier-symboli.",
    ('settings.function', 'description'): "Otsikko sivuston toimintaosioon asetussivulla",
    ('title.apiCode', 'message'): "API-koodi tälle pyynnölle",
    ('title.apiCode', 'description'): "Otsikko dialogille, joka näyttää vastaavan API-koodin (curl / Python / Node) tuotteen sisällä luodun tuloksen toistamiseksi",
    ('message.viewCodeHint', 'message'): "Näytä API-koodi tälle pyynnölle",
    ('message.viewCodeHint', 'description'): "Tooltip-teksti Näytä koodi -painikkeessa tuloskortin toimintopainikkeiden vieressä. Painike avaa dialogin curl/Python/Node-pätkillä, jotka toistavat saman generoinnin julkisen API:n kautta.",
    ('button.viewCode', 'message'): "Näytä koodi",
    ('button.viewCode', 'description'): "Painikkeen teksti, joka avaa dialogin vastaavalla API-koodilla (curl / Python / Node) nykyiselle tulokselle",
    ('button.getApiKey', 'message'): "Hanki API-avain",
    ('button.getApiKey', 'description'): "Linkin teksti API-koodidialogissa, joka avaa konsolin sivun, jossa käyttäjät voivat luoda API-avaimen",
    ('button.apiPlatform', 'description'): "API-koodidialogissa oleva painike. Napsauttaminen avaa https://platform.acedata.cloud/ uudessa välilehdessä API-avainten, saldon ja käytön hallintaan.",
    ('appUpgrade.title', 'message'): "Päivitys vaaditaan",
    ('appUpgrade.title', 'description'): "Natiivisovelluksen versiovaatimuksen modaalin otsikko käynnistyksen yhteydessä, kun asennettu versio on vanhempi kuin taustapalvelimen tukema versio",
    ('appUpgrade.blockMessage', 'message'): "Tätä versiota ei enää tueta. Päivitä sovelluksesi sovelluskaupasta jatkaaksesi.",
    ('appUpgrade.blockMessage', 'description'): "Pakollisen päivitysmodaalin teksti, kun asennettu versio on alle min_supported. Modaalissa ei ole sulkemismahdollisuutta — ainoa painike avaa sovelluskaupan.",
    ('appUpgrade.softMessage', 'message'): "Uudempi versio on saatavilla. Päivitä sovelluskaupasta parhaan käyttökokemuksen saamiseksi.",
    ('appUpgrade.softMessage', 'description'): "Pehmeän päivityskehutteen teksti, kun asennettu versio on alle latest mutta yli min_supported. Käyttäjä voi hylätä ja jatkaa sovelluksen käyttöä.",
    ('appUpgrade.openStore', 'message'): "Päivitä nyt",
    ('appUpgrade.openStore', 'description'): "Päivitysmodaalin ensisijainen painike — avaa App Store / Play Store -URL:n järjestelmäselaimessa",
    ('appUpgrade.later', 'message'): "Myöhemmin",
    ('appUpgrade.later', 'description'): "Pehmeän päivityskehutteen toissijainen painike — sulkee modaalin ja antaa käyttäjän jatkaa nykyisellä versiolla. Näytetään vain ei-pakollisissa päivityksissä.",
    ('nav.digitalhuman', 'description'): "Sivuston navigointipalkin teksti Digital Human -puhevideo-sivulle",
    ('nav.omni', 'description'): "Navigointipalkin etiketti Omni Video -moduulille",

    # settings.localTools* descriptions
    ('settings.localTools', 'description'): "Vain työpöytäsovelluksessa käytettävissä oleva asetusvälilehti paikallisten työkalukansioiden, oikeuksien ja lupien hallintaan",
    ('settings.localToolsDesktopOnly', 'description'): "Näytetään, kun Paikalliset työkalut -välilehti avataan verkko- tai mobiilisovelluksessa",
    ('settings.localToolsFoldersTitle', 'description'): "Otsikko luettelolle kansioista, joita tekoäly voi lukea/kirjoittaa paikallisesti",
    ('settings.localToolsFoldersHint', 'description'): "Ohjeteksti valtuutettujen kansioiden otsikon alla",
    ('settings.localToolsComputerUseTitle', 'message'): "Tietokoneen käyttö (kokeellinen)",
    ('settings.localToolsComputerUseTitle', 'description'): "Otsikko tietokoneen käyttöominaisuuden (näyttö + hiiri/näppäimistöohjaus) kytkimelle",
    ('settings.localToolsComputerUseHint', 'message'): "Anna tekoälyn nähdä näyttösi ja ohjata hiirtä ja näppäimistöä tällä tietokoneella. Oletuksena pois päältä — ota käyttöön vain, jos luotat käynnissä oleville tekoälytehtäville.",
    ('settings.localToolsComputerUseHint', 'description'): "Ohjeteksti tietokoneen käyttökytkimen alla",
    ('settings.localToolsAddFolder', 'description'): "Painike kansion valitsemiseen ja valtuuttamiseen",
    ('settings.localToolsRemove', 'description'): "Painike valtuutetun kansion poistamiseen",
    ('settings.localToolsNoFolders', 'description'): "Tyhjä tila valtuutettujen kansioiden luettelolle",
    ('settings.localToolsSave', 'description'): "Tallenna valtuutetut kansiot",
    ('settings.localToolsMcpTitle', 'message'): "MCP-palvelimet",
    ('settings.localToolsMcpTitle', 'description'): "Paikallisten MCP-palvelinten asetusosion otsikko Paikalliset työkalut -asetuksissa",
    ('settings.localToolsMcpHint', 'message'): "Yhdistä paikalliset MCP-palvelimet stdion kautta. Niiden työkalut tulevat tekoälyn käyttöön samojen toimintokohtaisten lupavirtojen alaisina kuin paikalliset kansiotyökalut. Muutokset tulevat voimaan ilman uudelleenkäynnistystä.",
    ('settings.localToolsMcpHint', 'description'): "Selittää, mitä paikalliset MCP-palvelimet tekevät ja että muutokset tulevat voimaan ilman uudelleenkäynnistystä",
    ('settings.localToolsMcpAdd', 'message'): "Lisää palvelin",
    ('settings.localToolsMcpAdd', 'description'): "Painike uuden paikallisen MCP-palvelinrivin lisäämiseen",
    ('settings.localToolsMcpName', 'message'): "Nimi",
    ('settings.localToolsMcpName', 'description'): "Etiketti MCP-palvelimen nimi/tunnus-kentälle",
    ('settings.localToolsMcpCommand', 'message'): "Komento",
    ('settings.localToolsMcpCommand', 'description'): "Etiketti MCP-palvelimen käynnistyskomennon kentälle",
    ('settings.localToolsMcpArgs', 'message'): "Argumentit",
    ('settings.localToolsMcpArgs', 'description'): "Etiketti MCP-palvelimen komentoriviargumenttien kentälle",
    ('settings.localToolsMcpArgsHint', 'message'): "Yksi argumentti per rivi.",
    ('settings.localToolsMcpArgsHint', 'description'): "MCP-argumenttien tekstialueen paikkamerkki/vihje",
    ('settings.localToolsMcpEnv', 'message'): "Ympäristömuuttujat",
    ('settings.localToolsMcpEnv', 'description'): "Etiketti MCP-palvelimen ympäristömuuttujien kentälle",
    ('settings.localToolsMcpEnvHint', 'message'): "Yksi KEY=VALUE per rivi.",
    ('settings.localToolsMcpEnvHint', 'description'): "MCP-ympäristömuuttujien tekstialueen paikkamerkki/vihje",
    ('settings.localToolsMcpNoServers', 'message'): "MCP-palvelimia ei ole määritetty.",
    ('settings.localToolsMcpNoServers', 'description'): "Tyhjä tila, joka näkyy, kun MCP-palvelimia ei ole määritetty",
    ('settings.localToolsMcpNamePlaceholder', 'message'): "esim. filesystem",
    ('settings.localToolsMcpNamePlaceholder', 'description'): "Paikkamerkki MCP-palvelimen nimisyötteelle",
    ('settings.localToolsMcpCommandPlaceholder', 'message'): "esim. npx",
    ('settings.localToolsMcpCommandPlaceholder', 'description'): "Paikkamerkki MCP-palvelimen komentosyötteelle",
    ('settings.localToolsMcpNameRequired', 'message'): "Jokaisella palvelimella täytyy olla nimi ja komento.",
    ('settings.localToolsMcpNameRequired', 'description'): "Vahvistusvirhe, kun palvelinrivillä puuttuu nimi tai komento",
    ('settings.localToolsMcpDuplicateName', 'message'): "Palvelimien nimien täytyy olla yksilöllisiä.",
    ('settings.localToolsMcpDuplicateName', 'description'): "Vahvistusvirhe, kun kahdella palvelimella on sama nimi",
    ('settings.localToolsMcpNameInvalid', 'message'): "Nimi voi sisältää vain kirjaimia, numeroita, yhdysviivoja ja alaviivoja.",
    ('settings.localToolsMcpNameInvalid', 'description'): "Vahvistusvirhe, kun palvelimen nimi sisältää virheellisiä merkkejä",
    ('settings.localToolsMcpEnabled', 'message'): "Päällä",
    ('settings.localToolsMcpEnabled', 'description'): "Kytkimen etiketti paikallisen MCP-palvelimen käyttöön ottamiseen/poistamiseen",
    ('settings.localToolsMcpReconnect', 'message'): "Testaa / Yhdistä uudelleen",
    ('settings.localToolsMcpReconnect', 'description'): "Painike yhden MCP-palvelimen uudelleenkäynnistämiseen ja tilan päivittämiseen",
    ('settings.localToolsMcpConnecting', 'message'): "Yhdistetään…",
    ('settings.localToolsMcpConnecting', 'description'): "Tila-merkki, kun MCP-palvelin on yhdistymässä",
    ('settings.localToolsMcpNotSaved', 'message'): "Ei vielä tallennettu",
    ('settings.localToolsMcpNotSaved', 'description'): "Tila-merkki MCP-palvelinriville, jota ei ole vielä tallennettu/yhdistetty",
    ('settings.localToolsMcpConnected', 'message'): "Yhdistetty · {n} työkalua",
    ('settings.localToolsMcpConnected', 'description'): "Tila-merkki, kun MCP-palvelin on yhdistynyt; {n} on työkalujen lukumäärä",
    ('settings.localToolsMcpDisabled', 'message'): "Poistettu käytöstä",
    ('settings.localToolsMcpDisabled', 'description'): "Tila-merkki, kun MCP-palvelin on pois käytöstä",
    ('settings.localToolsMcpFailed', 'message'): "Yhdistäminen epäonnistui",
    ('settings.localToolsMcpFailed', 'description'): "Tila-merkki, kun MCP-palvelin ei käynnistynyt; syy näytetään alla",
    ('settings.localToolsMcpPlatformHint', 'message'): "Vinkki: käytä PATH:ssa olevaa komentoa, kuten npx tai uvx (esim. npx -y {'@'}modelcontextprotocol/server-filesystem ~/Documents). Windowsissa npx/node löytyvät automaattisesti. Jos palvelin näyttää \"spawn … ENOENT\", aseta komento täydelliseksi poluksi.",
    ('settings.localToolsMcpPlatformHint', 'description'): "Alustojen välinen vinkki MCP-käynnistyskomennon määrittämiseen",
    ('settings.localToolsSaved', 'description'): "Väliaikainen vahvistus paikallisten työkalukansioiden tallentamisen jälkeen",
    ('settings.localToolsActiveTools', 'description'): "Etiketti tällä hetkellä saatavilla olevien paikallisten työkalujen luettelossa",
    ('settings.localToolsGrantsTitle', 'description'): "Otsikko pysyvien suostumustensien luettelolle",
    ('settings.localToolsGrantsHint', 'description'): "Ohjeteksti aina-sallittujen toimintojen otsikon alla",
    ('settings.localToolsRevoke', 'description'): "Painike yhden aina-salli-luvan peruuttamiseen",
    ('settings.localToolsRevokeAll', 'description'): "Painike kaikkien aina-salli-lupien peruuttamiseen",
    ('settings.localToolsNoGrants', 'description'): "Tyhjä tila aina-sallittujen toimintojen luettelolle",
    ('settings.localToolsPermsTitle', 'description'): "Otsikko macOS-järjestelmäoikeuksien osiolle",
    ('settings.localToolsPermsHint', 'description'): "Ohjeteksti järjestelmäoikeuksien otsikon alla",
    ('settings.localToolsPermFullDisk', 'description'): "macOS-koko levyn käyttöoikeusrivi",
    ('settings.localToolsPermScreen', 'description'): "macOS-näyttötallennusoikeusrivi",
    ('settings.localToolsPermAccessibility', 'description'): "macOS-saavutettavuusoikeusrivi",
    ('settings.localToolsGranted', 'description'): "Tila-tagi, kun järjestelmäoikeus on myönnetty",
    ('settings.localToolsNotGranted', 'description'): "Tila-tagi, kun järjestelmäoikeutta ei ole myönnetty",
    ('settings.localToolsOpen', 'description'): "Painike, joka avaa asianmukaisen macOS-järjestelmäasetusruudun",
    ('settings.customDomain', 'description'): "Asetuspopupin mukautetun verkkotunnuksen hallinnan välilehden otsikko. Näkyy vain alisivustoilla (ei pääsivustolla) sivuston ylläpitäjille.",
    ('settings.contactSupport', 'description'): "Tietosivun osion otsikko, joka luettelee sivuston omistajan asiakaspalvelukanavat",
    ('settings.contactSupportTip', 'description'): "Alaotsikko tukiyhteystietojen osiossa Tietosivulla",
    ('settings.contactInvalidUrl', 'description'): "Vahvistusvirhe, kun yhteystiedon URL ei ole kelvollinen http(s)-linkki",
    ('settings.contactInvalidPhone', 'description'): "Vahvistusvirhe, kun puhelinnumero on virheellinen",
    ('settings.contactInvalidEmail', 'description'): "Vahvistusvirhe, kun sähköpostiosoite on virheellinen",
    ('settings.contactType', 'description'): "Paikkamerkki yhteystietotyypin valitsimelle muokkaimessa",
    ('settings.contactType_phone', 'description'): "Näyttönimi puhelimen yhteystietotyypille",
    ('settings.contactType_email', 'description'): "Näyttönimi sähköpostin yhteystietotyypille",
    ('settings.contactType_website', 'description'): "Näyttönimi verkkosivuston yhteystietotyypille",
    ('settings.contactType_wechat', 'description'): "Näyttönimi WeChat-yhteystietotyypille",
    ('settings.contactLabelPlaceholder', 'message'): "Etiketti (valinnainen), esim. Myynti",
    ('settings.contactLabelPlaceholder', 'description'): "Paikkamerkki valinnaiselle yhteystiedon etikettisyötteelle",
    ('settings.contactValuePlaceholder', 'message'): "Tili / näytettävä teksti",
    ('settings.contactValuePlaceholder', 'description'): "Paikkamerkki yleiselle yhteystiedon arvosyötteelle",
    ('settings.contactQr', 'description'): "Etiketti yhteystiedon QR-koodikuvalle",
    ('settings.contactQrTip', 'message'): "Lataa QR-koodi, jonka käyttäjät voivat skannata lisätäkseen sinut.",
    ('settings.contactQrTip', 'description'): "Vinkki yhteystiedon QR-koodin lataajalle",
    ('settings.contactAdd', 'description'): "Painike uuden yhteystietomerkinnän lisäämiseen",
    ('settings.contactEditorHint', 'message'): "Valitse tyyppi jokaiselle kanavalle ja täytä vähintään arvo, linkki tai QR-koodi. Lisää niin monta kuin haluat.",
    ('settings.contactEditorHint', 'description'): "Vihje yhteystietojen muokkaimen dialogin yläosassa",
    ('settings.contactInvalidType', 'message'): "Tyyppi voi sisältää vain pieniä kirjaimia, numeroita, '-' ja '_'",
    ('settings.contactInvalidType', 'description'): "Vahvistusvirhe virheelliselle yhteystietotyypin tunnukselle",
    ('settings.contactRowNeedsValue', 'message'): "Jokaisessa yhteystiedossa on oltava vähintään arvo, linkki tai QR-koodi",
    ('settings.contactRowNeedsValue', 'description'): "Vahvistusvirhe, kun yhteystietorivillä ei ole arvoa/url:ia/qr:ää",
    ('settings.contactInvalidValue', 'message'): "Yhteystietokenttä on virheellinen tai liian pitkä",
    ('settings.contactInvalidValue', 'description'): "Vahvistusvirhe, kun yhteystiedon arvo/etiketti on virheellinen tai liian pitkä",
    ('settings.contactTooMany', 'message'): "Voit lisätä enintään {max} yhteystietoa",
    ('settings.contactTooMany', 'description'): "Vahvistusvirhe, kun lisätään liikaa yhteystietoja",
    ('settings.localToolsAndroidPermHint', 'message'): "Ota käyttöön saavutettavuuspalvelu, jotta avustaja voi nähdä ja ohjata näyttöäsi. Voit ennakkoluvittaa toimintoja välttääksesi jokaisen toiminnon vahvistuspyynnön.",
    ('settings.localToolsAndroidPermHint', 'description'): "Ohje Android-tietokoneen käytön saavutettavuusoikeuksia varten Asetuksissa",
    ('settings.cuConsentTitle', 'message'): "Sallitaanko toiminto?",
    ('settings.cuConsentTitle', 'description'): "Tietokoneen käyttöpyynnön suostumisdialogissa otsikko",
    ('settings.cuConsentMessage', 'message'): 'Avustaja haluaa suorittaa toiminnon "{action}" puhelimellasi. Sallitaanko se?',
    ('settings.cuConsentMessage', 'description'): "Suostumisdialoginen teksti; {action} on computer.*-toiminnon nimi",
    ('settings.cuConsentAllow', 'message'): "Salli kerran",
    ('settings.cuConsentAllow', 'description'): "Suostumisdialogissa salli-painike",
    ('settings.cuConsentAlways', 'message'): "Salli aina",
    ('settings.cuConsentAlways', 'description'): "Suostumisdialogissa aina-salli-painike; tallentaa luvan niin, ettei tämä toiminto enää pyydä vahvistusta",
    ('settings.cuConsentDeny', 'message'): "Kiellä",
    ('settings.cuConsentDeny', 'description'): "Suostumisdialogissa kiellä-painike",
    ('settings.memoryEnabled', 'message'): "Käytä muistia",
    ('settings.memoryEnabled', 'description'): "Kytkimen otsikko, joka ohjaa, käyttävätkö chatit tallennettua muistia ja oppivat uutta muistia",
    ('settings.memoryEnabledHint', 'message'): "Kun pois päältä, tallennettuja muistoja ei käytetä eikä uusiin chatteihin luoda muistoja. Olemassa olevat muistot säilyvät.",
    ('settings.memoryEnabledHint', 'description'): "Käyttäytymisselitys muistikytkimen alla",
    ('settings.memoryImport', 'message'): "Tuo",
    ('settings.memoryImport', 'description'): "Painike, joka avaa muistin tuontidialogiin",
    ('settings.memoryImportTitle', 'message'): "Tuo muistia toisesta tekoälystä",
    ('settings.memoryImportTitle', 'description'): "Muistin tuontidialogissa otsikko",
    ('settings.memoryImportExportStep', 'message'): "1. Pyydä nykyistä tekoälyäsi viemään muistinsa",
    ('settings.memoryImportExportStep', 'description'): "Ensimmäinen vaiheotsikko muistin tuontidialogissa",
    ('settings.memoryImportPrompt', 'message'): "Siirtymässä toiseen tekoälypalveluun. Listaa jokainen tallennettu muisti ja pysyvä konteksti, jonka olet oppinut minusta. Laita kaikki yhteen koodilohkoon, yksi muisti per rivi. Muotoile jokainen rivi näin: [tallennuspäivä, jos saatavilla] - muistin sisältö. Sisällytä vastausmieltymykset, henkilökohtaiset tiedot, projektit, tavoitteet, työkalut, kielet, sovelluskehykset ja tekemäni korjaukset. Säilytä omat sanani mahdollisuuksien mukaan. Älä sisällytä salaisuuksia tai arkaluonteisia tietoja.",
    ('settings.memoryImportPrompt', 'description'): "Kehote, jonka käyttäjät kopioivat toiseen tekoälypalveluun muistojen viemiseksi",
    ('settings.memoryImportCopy', 'message'): "Kopioi kehote",
    ('settings.memoryImportCopy', 'description'): "Painike, joka kopioi muistin vientikehutteen",
    ('settings.memoryImportCopied', 'message'): "Kehote kopioitu",
    ('settings.memoryImportCopied', 'description'): "Ilmoitus muistin vientikehutteen kopioimisen jälkeen",
    ('settings.memoryImportPasteStep', 'message'): "2. Liitä viety muisti",
    ('settings.memoryImportPasteStep', 'description'): "Toinen vaiheotsikko muistin tuontidialogissa",
    ('settings.memoryImportPlaceholder', 'message'): "Liitä ChatGPT:n, Clauden, Geminin tai muun tekoälyn palauttama muistiteksti tähän…",
    ('settings.memoryImportPlaceholder', 'description'): "Paikkamerkki liitetylle muistin vientitekstille",
    ('settings.memoryImportSubmit', 'message'): "Lisää muistiin",
    ('settings.memoryImportSubmit', 'description'): "Painike, joka lähettää liitetyt muistot tuotavaksi",
    ('settings.memoryImportPartial', 'message'): "Käsitelty {processed} merkintää; {rejected} turvatonta tai virheellistä merkintää ohitettiin.",
    ('settings.memoryImportPartial', 'description'): "Varoitus osittaisen muistin tuonnin jälkeen",
    ('settings.memoryImportInvalid', 'message'): "Muistoja ei voitu tuoda. Varmista, että muisti on päällä, ja liitä yksi yksinkertainen fakta per rivi.",
    ('settings.memoryImportInvalid', 'description'): "Toimintakehotusvirhe, joka näytetään, kun muistin tuontipyyntö on virheellinen",
    ('settings.memoryImportInProgress', 'message'): "Muistin tuonti on jo käynnissä. Pidä tämä dialogi auki ja yritä uudelleen hetken kuluttua.",
    ('settings.memoryImportInProgress', 'description'): "Varoitus, joka näytetään, kun toinen muistin tuontityö on käynnissä",
}

# Apply translations to common.json
common_path = '/home/runner/work/Nexior/Nexior/src/i18n/fi/common.json'
data = load_json(common_path)
changed = 0
for k, v in data.items():
    if not isinstance(v, dict):
        continue
    for field in ('message', 'description'):
        key = (k, field)
        if key in common_translations:
            old_val = v.get(field, '')
            new_val = common_translations[key]
            if old_val != new_val:
                v[field] = new_val
                changed += 1
save_json(common_path, data)
print(f"common.json: {changed} fields updated")

# ─── DISTRIBUTION.JSON translations ─────────────────────────────────────────
dist_translations = {
    ('message.deltaPriceForNextLevel', 'description'): "Ero nykyisen tilausmäärän ja seuraavan tason rajan välillä.",
    ('message.distributionQrDescription', 'description'): "Kuvaus suositus-QR-koodista.",
    ('message.updateSuccessfully', 'description'): "Viesti, joka ilmaisee, että suositustiedot on päivitetty onnistuneesti.",
    ('message.distributionLinkDescription', 'description'): "Kuvaus suosituslinkin toiminnasta.",
    ('message.distributionLinkDescription2', 'description'): "Lisäkuvaus suosituslinkin toiminnasta.",
}
dist_path = '/home/runner/work/Nexior/Nexior/src/i18n/fi/distribution.json'
data = load_json(dist_path)
changed = 0
for k, v in data.items():
    if not isinstance(v, dict):
        continue
    for field in ('message', 'description'):
        key = (k, field)
        if key in dist_translations:
            old_val = v.get(field, '')
            new_val = dist_translations[key]
            if old_val != new_val:
                v[field] = new_val
                changed += 1
save_json(dist_path, data)
print(f"distribution.json: {changed} fields updated")

# ─── SERVICE.JSON translations ───────────────────────────────────────────────
svc_translations = {
    ('unit.count', 'description'): "Laskuriyksikkö (API-kutsujen lukumäärä), yksikkö.",
    ('unit.Count', 'description'): "Laskuriyksikkö (API-kutsujen lukumäärä), yksikkö.",
    ('unit.counts', 'description'): "Laskuriyksikkö (API-kutsujen lukumäärä), monikko.",
    ('unit.Counts', 'description'): "Laskuriyksikkö (API-kutsujen lukumäärä), monikko.",
}
svc_path = '/home/runner/work/Nexior/Nexior/src/i18n/fi/service.json'
data = load_json(svc_path)
changed = 0
for k, v in data.items():
    if not isinstance(v, dict):
        continue
    for field in ('message', 'description'):
        key = (k, field)
        if key in svc_translations:
            old_val = v.get(field, '')
            new_val = svc_translations[key]
            if old_val != new_val:
                v[field] = new_val
                changed += 1
save_json(svc_path, data)
print(f"service.json: {changed} fields updated")

# ─── APPLICATION.JSON translations ───────────────────────────────────────────
app_translations = {
    ('badge.shared', 'message'): "Jaettu",
    ('badge.shared', 'description'): "Merkki sovellusluettelossa, joka osoittaa, että sovellus on jonkun muun valtuuttama nykyiselle käyttäjälle (ei heidän omistamansa).",
}
app_path = '/home/runner/work/Nexior/Nexior/src/i18n/fi/application.json'
data = load_json(app_path)
changed = 0
for k, v in data.items():
    if not isinstance(v, dict):
        continue
    for field in ('message', 'description'):
        key = (k, field)
        if key in app_translations:
            old_val = v.get(field, '')
            new_val = app_translations[key]
            if old_val != new_val:
                v[field] = new_val
                changed += 1
save_json(app_path, data)
print(f"application.json: {changed} fields updated")

# ─── INDEX.JSON translations ─────────────────────────────────────────────────
index_translations = {
    ('title.chat', 'description'): "AI-chatin osion otsikko",
    ('title.midjourney', 'description'): "AI-piirtämisen osion otsikko",
    ('title.qrart', 'description'): "AI-taide QR-koodin osion otsikko",
    ('title.suno', 'description'): "AI-musiikin osion otsikko",
    ('title.luma', 'description'): "AI-videon osion otsikko",
    ('title.comments', 'description'): "Asiakasarvioiden osion otsikko",
    ('title.introduction', 'description'): "Sivuston esittelyn otsikko",
    ('subtitle.banner', 'description'): "Sivuston alaotsikko",
    ('subtitle.chat', 'description'): "AI-chatin osion alaotsikko",
    ('subtitle.midjourney', 'description'): "AI-piirtämisen osion alaotsikko",
    ('subtitle.qrart', 'description'): "AI-taide QR-koodin osion alaotsikko",
    ('subtitle.suno', 'description'): "AI-musiikin osion alaotsikko",
    ('subtitle.luma', 'description'): "AI-videon osion alaotsikko",
    ('subtitle.comments', 'description'): "Asiakasarvioiden osion alaotsikko",
    ('subtitle.introduction', 'description'): "Sivuston esittelyn alaotsikko",
    ('button.try', 'description'): "Painikkeen teksti etusivun Hero-alueella",
    ('button.testEnv', 'description'): "Testiympäristö-painikkeen teksti",
    ('customers.name1', 'description'): "Asiakkaan nimi",
    ('customers.job1', 'description'): "Asiakkaan ammatti",
    ('customers.comment1', 'description'): "Asiakkaan arvio",
    ('customers.name2', 'description'): "Asiakkaan nimi",
    ('customers.job2', 'description'): "Asiakkaan ammatti",
    ('customers.comment2', 'description'): "Asiakkaan arvio",
    ('customers.name3', 'description'): "Asiakkaan nimi",
    ('customers.job3', 'description'): "Asiakkaan ammatti",
    ('customers.comment3', 'description'): "Asiakkaan arvio",
}
index_path = '/home/runner/work/Nexior/Nexior/src/i18n/fi/index.json'
data = load_json(index_path)
changed = 0
for k, v in data.items():
    if not isinstance(v, dict):
        continue
    for field in ('message', 'description'):
        key = (k, field)
        if key in index_translations:
            old_val = v.get(field, '')
            new_val = index_translations[key]
            if old_val != new_val:
                v[field] = new_val
                changed += 1
save_json(index_path, data)
print(f"index.json: {changed} fields updated")

print("Done!")
