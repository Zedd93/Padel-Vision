package com.padelvision.shared.enums;

public enum YouTubeConnectionStatus {
    /** Token odświeżający działa, klub może transmitować. */
    CONNECTED,
    /** Klub cofnął zgodę w koncie Google — wymagane ponowne połączenie. */
    REVOKED,
    /** Google odrzuca wywołania z innego powodu niż cofnięta zgoda. */
    ERROR
}
