'use strict';

const Hapi = require('@hapi/hapi');
const { request } = require('http');
const { nanoid } = require('nanoid');
const { finished } = require('stream');

let books = [];

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: 'localhost',
  });

  // API untuk Menyimpan Buku
  server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

      if (!name) {
        return h
          .response({
            status: 'fail',
            message: 'Gagal menambahkan buku. Mohon isi nama buku',
          })
          .code(400);
      }

      if (readPage > pageCount) {
        return h
          .response({
            status: 'fail',
            message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
          })
          .code(400);
      }

      const id = nanoid();
      const insertedAt = new Date().toISOString();
      const updateAt = insertedAt;

      const newBook = {
        id,
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading,
        finished: readPage === pageCount,
        insertedAt,
        updateAt,
      };

      books.push(newBook);

      return h
        .response({
          status: 'success',
          message: 'Buku berhasil ditambahkan',
          data: {
            bookId: id,
          },
        })
        .code(201);
    },
  });

  // API untuk Menampilkan semua Buku
  server.route({
    method: 'GET',
    path: '/books',
    handler: (request, h) => {
      const filteredBooks = books.map((book) => ({
        id: book.id,
        name: book.name,
        publisher: book.publisher,
      }));

      const limitedBooks = filteredBooks.slice(0, 3);

      return {
        status: 'success',
        data: {
          books: limitedBooks,
        },
      };
    },
  });

  // API untuk Menampilkan detail Buku
  server.route({
    method: 'GET',
    path: '/books/{id}',
    handler: (request, h) => {
      const { id } = request.params;
      const book = books.find((b) => b.id === id);

      if (!book) {
        return h
          .response({
            status: 'fail',
            message: 'Buku tidak ditemukan',
          })
          .code(404);
      }
      return {
        status: 'success',
        data: {
          book: {
            ...book,
            updatedAt: book.updateAt,
          },
        },
      };
    },
  });

  // API untuk Mengubah data Buku
  server.route({
    method: 'PUT',
    path: '/books/{id}',
    handler: (request, h) => {
      const { id } = request.params;
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

      const bookIndex = books.findIndex((book) => book.id === id);

      if (bookIndex === -1) {
        return h
          .response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Id tidak ditemukan',
          })
          .code(404);
      }

      if (!name) {
        return h
          .response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Mohon isi nama buku',
          })
          .code(400);
      }

      if (readPage > pageCount) {
        return h
          .response({
            status: 'fail',
            message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
          })
          .code(400);
      }

      const updateBook = {
        ...books[bookIndex],
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading,
        finished: readPage === pageCount,
        updateAt: new Date().toISOString(),
      };

      books[bookIndex] = updateBook;

      return h
        .response({
          status: 'success',
          message: 'Buku berhasil diperbarui',
          data: {
            book: updateBook,
          },
        })
        .code(200);
    },
  });

  // API untuk Menghapus Buku
  server.route({
    method: 'DELETE',
    path: '/books/{id}',
    handler: (request, h) => {
      const { id } = request.params;
      const bookIndex = books.findIndex((book) => book.id === id);

      if (bookIndex === -1) {
        return h
          .response({
            status: 'fail',
            message: 'Buku gagal dihapus. Id tidak ditemukan',
          })
          .code(404);
      }

      books.splice(bookIndex, 1);

      return h
        .response({
          status: 'success',
          message: 'Buku berhasil dihapus',
        })
        .code(200);
    },
  });

  await server.start();
  console.log('Server berjalan di %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
