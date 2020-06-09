package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
)

const (
    KEYLEN = 16
    NONCELEN = 12
)

func genRand(n int) ([]byte, error) {
    b := make([]byte, n)

    if _, err := rand.Read(b); err != nil {
        return nil, err
    }

    return b, nil
}

func copyHelper(src []byte, srcStart int, dst []byte, dstStart int, size int)  {
    srcEnd := srcStart + size
    copy(dst[dstStart:], src[srcStart:srcEnd])
}

func encryptUser(user User) (string, error) {
    plaintext, err := json.Marshal(user)
    if err != nil {
        return "", err
    }

    block, err := aes.NewCipher(KEY)
    if err != nil {
        return "", err
    }

    nonce, err := genRand(NONCELEN)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    ciphertext := gcm.Seal(nil, nonce, plaintext, nil)
    cipherLen := len(ciphertext)

    output := make([]byte, NONCELEN + cipherLen)
    copyHelper(nonce, 0, output, 0, NONCELEN)
    copyHelper(ciphertext, 0, output, NONCELEN, cipherLen)

    cipherb64 := base64.RawURLEncoding.EncodeToString(output)
    return cipherb64, nil
}

func decryptUser(cipherb64 string, user *User) error {
    ciphertext, err := base64.RawURLEncoding.DecodeString(cipherb64)
    if err != nil {
        return err
    }

    block, err := aes.NewCipher(KEY)
    if err != nil {
        return err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return err
    }

    plaintext, err := gcm.Open(nil, ciphertext[0:NONCELEN], ciphertext[NONCELEN:], nil)
    if err != nil {
        return err
    }

    if err := json.Unmarshal(plaintext, user); err != nil {
        return err
    }

    return nil
}
