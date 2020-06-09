package main

import (
    "fmt"

    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/valyala/fasthttp"
    "github.com/valyala/fasthttp/reuseport"
    "github.com/go-pg/pg"
)

// Global variables voor prepared statements.
var findUser *pg.Stmt
var insertUser *pg.Stmt

// Globale variables for the CSV files
var generalCSV *CsvWriter
var clickCSV *CsvWriter
var mouseContextCSV *CsvWriter
var mouseExactCSV *CsvWriter
var scrollCSV *CsvWriter
var imageCSV *CsvWriter

// Global variable voor cookie password.
var KEY []byte
const KEYSTRING = "oIWk9mJiMEn5MpOm"

// Global variable voor server listen adres.
const ADDR = "127.0.0.1:9999"

func main() {
    KEY = []byte(KEYSTRING)

    // Connect to database.
    db := pg.Connect(&pg.Options{
        User: "xavier",
        Network: "unix",
        Database: "test",
    })
    defer db.Close()

    // Prepared statement for finding users.
    var err error
    findUser, err = db.Prepare(`SELECT id FROM data WHERE id = ($1::bigint)`)
    if err != nil {
        log.Fatal("findUser db.Prepare(): ", err)
    }
    defer findUser.Close()

    // Prepared statement for inserting users.
    insertUser, err = db.Prepare(`INSERT INTO data (name) VALUES ($1::text) RETURNING id`)
    if err != nil {
        log.Fatal("insertUser db.Prepare(): ", err)
    }
    defer insertUser.Close()

    // Create `sample.csv` in current directory
    var err2 error
    generalCSV, err2 = NewCsvWriter("generalData.csv")
    if err2 != nil {
        fmt.Printf("RIPPP general CSV\n\n")
        panic("Could not open `generalData.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer generalCSV.Close()

    var err3 error
    clickCSV, err3 = NewCsvWriter("clickData.csv")
    if err3 != nil {
        fmt.Printf("RIPPP click CSV\n\n")
        panic("Could not open `clickData.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer clickCSV.Close()

    var err4 error
    mouseContextCSV, err4 = NewCsvWriter("mouseContext.csv")
    if err4 != nil {
        fmt.Printf("RIPPP mouse context CSV\n\n")
        panic("Could not open `mouseContext.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer mouseContextCSV.Close()

    var err5 error
    scrollCSV, err5 = NewCsvWriter("scrollData.csv")
    if err5 != nil {
        fmt.Printf("RIPPP scroll CSV\n\n")
        panic("Could not open `mouseContext.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer scrollCSV.Close()

    var err6 error
    mouseExactCSV, err6 = NewCsvWriter("mouseExact.csv")
    if err6 != nil {
        fmt.Printf("RIPPP mouse exact CSV\n\n")
        panic("Could not open `mouseContext.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer mouseExactCSV.Close()

    var err7 error
    imageCSV, err7 = NewCsvWriter("image.csv")
    if err7 != nil {
        fmt.Printf("RIPPP image CSV\n\n")
        panic("Could not open `image.csv` for writing")
    }

    // Flush pending writes and close file upon exit of main()
    defer imageCSV.Close()

    // Configure fasthttp server.
    srv := &fasthttp.Server{
        Handler: handler,
        Name: "-",
    }

    // Run server in the background.
    done := make(chan int)
    go func() {
        ln, err := reuseport.Listen("tcp4", ADDR)
        if err != nil {
            log.Fatal("reuseport Listen(): ", err)
        }

        if err := srv.Serve(ln); err != nil {
            log.Fatal("Serve(): ", err)
        }

        done <- 1
    }()

    // Listen for signals.
    sig := make(chan os.Signal)
    signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
    <-sig

    // Stop server when signal is received.
    if err := srv.Shutdown(); err != nil {
        log.Fatal("Shutdown(): ", err)
    }

    <-done
}
