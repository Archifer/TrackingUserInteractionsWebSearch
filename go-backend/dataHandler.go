package main

import (
    "fmt"

    "github.com/valyala/fasthttp"
    "encoding/json"
    "encoding/base64"
    "time"
    "bytes"
    "os"
    "strconv"
    "image/png"
    "strings"
    // "github.com/go-pg/pg"
)

type GeneralData struct {
    ModuleStructure map[int]MyModule
    StartLoadPageTime time.Time
    UserQuery string
}

type MyModule struct {
    MyType string
    Rank int64
    IsVertical bool // if True it is in the second column (side panel)
    Url string
    ChildModules map[int]MyModule // additional modules within the module, mostly horizontal
    Visibility bool
    AdditionalInf map[string]string
    StartLoadPageTime time.Time
}

func writeStructue(ctx *fasthttp.RequestCtx, user User) {
  //  fmt.Println("POSTTT STRUCTURE")

    var generalData GeneralData
    err := json.Unmarshal(ctx.PostBody(), &generalData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
        return
    }

    // fmt.Printf("%+v\n", generalData)
    // fmt.Println("---")

    jsonString, err := json.Marshal(generalData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
        return
    }

    generalCSV.Write([]string{strconv.Itoa(user.UserID), generalData.StartLoadPageTime.Format("2006-01-02 15:04:05"), string(jsonString), generalData.UserQuery})
}

type ClickData struct {
    ParentId string
    ClickId string
    ClickX int
    ClickY int
    ClickTime int
    StartLoadPageTime time.Time
}

func writeClick(ctx *fasthttp.RequestCtx, user User) {
    // fmt.Println("POSTTT CLICK")

    var clickData ClickData
    err := json.Unmarshal(ctx.PostBody(), &clickData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
    }

    // fmt.Printf("%+v\n", clickData)
    // fmt.Println("---")

    clickCSV.Write([]string{strconv.Itoa(user.UserID), clickData.StartLoadPageTime.Format("2006-01-02 15:04:05"),
        clickData.ParentId, clickData.ClickId, strconv.Itoa(clickData.ClickX),
        strconv.Itoa(clickData.ClickY), strconv.Itoa(clickData.ClickTime)})
}

type MouseMoveContext struct {
    HooverId string
    ParentId string
    StartTime time.Time
    EndTime time.Time
    StartLoadPageTime time.Time
}

func writeMovementContext(ctx *fasthttp.RequestCtx, user User) {
    // fmt.Println("POSTTT MOUSE MOVEMENT CONTEXT")

    var mouseData MouseMoveContext
    err := json.Unmarshal(ctx.PostBody(), &mouseData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
    }

    // fmt.Printf("%+v\n", mouseData)
    // fmt.Println("---")

    mouseContextCSV.Write([]string{strconv.Itoa(user.UserID), mouseData.StartLoadPageTime.Format("2006-01-02 15:04:05"),
        mouseData.HooverId, mouseData.ParentId, mouseData.StartTime.Format("2006-01-02 15:04:05"),
        mouseData.EndTime.Format("2006-01-02 15:04:05")})
}

type MouseMoveExact struct {
    Xaxis int
    Yaxis int
    MouseInterval int
    StartLoadPageTime time.Time
}

func writeMovementExact(ctx *fasthttp.RequestCtx, user User) {
    // fmt.Println("POSTTT MOUSE MOVEMENT EXACT")

    var mouseData MouseMoveExact
    err := json.Unmarshal(ctx.PostBody(), &mouseData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
    }

    // fmt.Printf("%+v\n", mouseData)
    // fmt.Println("---")

    mouseExactCSV.Write([]string{strconv.Itoa(user.UserID), mouseData.StartLoadPageTime.Format("2006-01-02 15:04:05"),
        strconv.Itoa(mouseData.Xaxis), strconv.Itoa(mouseData.Yaxis), strconv.Itoa(mouseData.MouseInterval)})
}

type ScrollData struct {
    IdleTime int
    Yaxis int
    StartLoadPageTime time.Time
}

func writeScroll(ctx *fasthttp.RequestCtx, user User) {
    // fmt.Println("POSTTT SCROLL")

    var scrollData ScrollData
    err := json.Unmarshal(ctx.PostBody(), &scrollData)
    if err != nil {
        fmt.Println("error")
        fmt.Println(err)
    }

    // fmt.Printf("%+v\n", scrollData)
    // fmt.Println("---")

    scrollCSV.Write([]string{strconv.Itoa(user.UserID), scrollData.StartLoadPageTime.Format("2006-01-02 15:04:05"),
        strconv.Itoa(scrollData.IdleTime), strconv.Itoa(scrollData.Yaxis)})
}

type ImageData struct {
	Image string
	Timestamp time.Time
	StartLoadPageTime time.Time
}

func writeImage(ctx *fasthttp.RequestCtx, user User) {
	// fmt.Println("POSTTT IMAGE")

	var imageData ImageData
	err := json.Unmarshal(ctx.PostBody(), &imageData)

	unbased, err := base64.StdEncoding.DecodeString(imageData.Image)
	if err != nil {
		panic("Cannot decode b64")
	}

	r := bytes.NewReader(unbased)
	im, err := png.Decode(r)
	if err != nil {
		panic("Bad png")
	}

	saveString := strings.Replace(imageData.StartLoadPageTime.Format("2006-01-02 15:04:05"), ":", "", -1) + strings.Replace(imageData.Timestamp.String(), ":", "", -1)
	fileDestination := "images/IMG_" + strconv.Itoa(user.UserID) + saveString

	f, err := os.OpenFile(fileDestination, os.O_WRONLY|os.O_CREATE, 0777)
	if err != nil {
		panic("Cannot open file")
	}

	png.Encode(f, im)

	imageCSV.Write([]string{strconv.Itoa(user.UserID), imageData.Timestamp.Format("2006-01-02 15:04:05"), fileDestination})
}
