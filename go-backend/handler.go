package main

import (
    "fmt"

    "github.com/valyala/fasthttp"
    // "encoding/json"
    // "log"

    "github.com/go-pg/pg"
)


// User data struct, hier kan nog veel meer in.
type User struct {
    UserID int
    SessionID int64
}

// Checkt of een client al een user is.
func verify(ctx *fasthttp.RequestCtx, user *User) bool {
    if cookie := ctx.Request.Header.Cookie("id"); len(cookie) > 0 {
      if err := decryptUser(string(cookie), user); err == nil {
         /* if _, err := findUser.ExecOne(user.UserID); err == nil {
                return true
            } else if err.Error() != "pg: no rows in result set" {
                fmt.Println(err)
            }*/

            return true
        }
    }

    return false
}

// Voegt een client toe aan de database en returnt de aangemaakte ID's.
func login(ctx *fasthttp.RequestCtx) (User, error) {
    var user User
    name := "random" // TODO

    if !verify(ctx, &user) {
        if _, err := insertUser.QueryOne(pg.Scan(&user.UserID), name); err == nil {
            if err := setCookie(ctx, user); err == nil {
                return user, nil
            } else {
                ctx.Error("ERROR: crypto", fasthttp.StatusInternalServerError)
                return User{}, err
            }
        } else {
            fmt.Println(err)
            return User{}, err
        }

        // user.UserID = 21
        // user.SessionID = 69
        //
        // if err := setCookie(ctx, user); err == nil {
        //     return user, nil
        // } else {
        //     ctx.Error("ERROR: crypto", fasthttp.StatusInternalServerError)
        //     return User{}, err
        // }

        // fmt.Println("user had geen cookie")

        return user, nil
    } else {
        // fmt.Println("user had een cookie")
        return user, nil
    }
    // var user User

    // if _, err := insertUser.QueryOne(pg.Scan(&user.UserID), name); err == nil {
    //     return user, nil
    // } else {
    //     fmt.Println(err)
    //     return User{}, err
    // }
}

// Encrypt de userID in een cookie.
func setCookie(ctx *fasthttp.RequestCtx, user User) error {
    secret, err := encryptUser(user)
    if err != nil {
        fmt.Println(err)
        return err
    }

    var cookie fasthttp.Cookie
    cookie.SetKey("id")
    cookie.SetValue(secret)
    // cookie.SetDomain("localhost:8080")
    cookie.SetMaxAge(12960000) // cookies age is 5 months
    ctx.Response.Header.SetCookie(&cookie)

    return nil
}

// Handled alle GET requests.
func getHandler(ctx *fasthttp.RequestCtx) {
    switch string(ctx.Path()) {
    case "/foo":
        fmt.Fprintln(ctx, "foo")
    case "/bar":
        fmt.Fprintln(ctx, "bar")
    default:
        ctx.Error("ERROR: not found", fasthttp.StatusNotFound)
    }
}

type test_struct struct {
    Test string
}

// Handled alle POST requests.
func postHandler(ctx *fasthttp.RequestCtx) {
    if user, err := login(ctx); err == nil {
    //  fmt.Printf("%+v\n", user)

        switch string(ctx.Path()) {
        case "/postStructure":
            writeStructue(ctx, user)
        case "/postMouseClick":
            writeClick(ctx, user)
        case "/postMouseMovementContext":
            writeMovementContext(ctx, user)
        case "/postMouseMovementExact":
            writeMovementExact(ctx, user)
        case "/postScroll":
            writeScroll(ctx, user)
	case "/postImage":
			writeImage(ctx, user)
        default:
            fmt.Println("POST not supported")
            fmt.Println(string(ctx.Path()))
        }
    } else {
        return
    }

    // if data := ctx.FormValue("key"); len(data) > 0 {
    //     name := string(data)
    //     fmt.Fprint(ctx, "you sent: ", name)
    // } else {
    //     ctx.Error("ERROR: invalid POST data", fasthttp.StatusBadRequest)
    // }
}

// Handled alle requests.
func handler(ctx *fasthttp.RequestCtx) {
    ctx.SetContentType("application/json")

    switch string(ctx.Method()) {
    case "GET":
        getHandler(ctx)
    case "POST":
        postHandler(ctx)
    default:
        ctx.Error("ERROR: invalid request method", fasthttp.StatusMethodNotAllowed)
    }
}
