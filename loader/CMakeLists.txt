cmake_minimum_required(VERSION 3.18)
project(keypanel LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(keypanel SHARED Login.cpp)

target_include_directories(keypanel PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

find_library(log-lib log)
find_package(CURL REQUIRED)
find_package(OpenSSL REQUIRED)

target_link_libraries(keypanel
    ${log-lib}
    CURL::libcurl
    OpenSSL::SSL
    OpenSSL::Crypto
)

if(DEFINED KEYPANEL_ENDPOINT)
    target_compile_definitions(keypanel PRIVATE ENDPOINT_URL="${KEYPANEL_ENDPOINT}")
endif()

if(DEFINED KEYPANEL_GAME)
    target_compile_definitions(keypanel PRIVATE GAME_NAME="${KEYPANEL_GAME}")
endif()

if(DEFINED KEYPANEL_SECRET)
    target_compile_definitions(keypanel PRIVATE LICENSE_SECRET="${KEYPANEL_SECRET}")
endif()

if(DEFINED KEYPANEL_PINNED_KEY)
    target_compile_definitions(keypanel PRIVATE PINNED_PUBLIC_KEY="${KEYPANEL_PINNED_KEY}")
endif()
