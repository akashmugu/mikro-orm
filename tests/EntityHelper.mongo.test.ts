import { ObjectID } from 'bson';
import { Author, Book, BookTag } from './entities';
import { EntityManager, MikroORM } from '../lib';
import { initORM, wipeDatabase } from './bootstrap';
import { EntityHelper } from '../lib/EntityHelper';

/**
 * @class EntityHelperMongoTest
 */
describe('EntityHelperMongo', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

  test('#toObject() should return DTO', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    expect(author).toBeInstanceOf(Author);
    expect(author.toObject()).toBeInstanceOf(Object);
  });

  test('#toJSON() should return DTO', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    expect(author).toBeInstanceOf(Author);
    expect(author.toJSON()).toBeInstanceOf(Object);
  });

  test('#shouldPopulate() should return boolean', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    expect(author.shouldPopulate()).toBe(false); // off by default
    author.populated(true);
    expect(author.shouldPopulate()).toBe(true);
  });

  test('#getEntityManager() should return EntityManager', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    expect(() => EntityHelper.getEntityManager(author)).toThrowError(`This entity is not attached to EntityManager, please provide one!`);
    await orm.em.persist(author);
    expect(EntityHelper.getEntityManager(author)).toBeInstanceOf(EntityManager);
  });

  test('#init() should populate the entity', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persist(author);
    orm.em.clear();

    const jon = orm.em.getReference(Author.name, author.id);
    expect(jon.isInitialized()).toBe(false);
    await EntityHelper.init(jon);
    expect(jon.isInitialized()).toBe(true);
  });

  test('#assign() should update entity values', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    await orm.em.persist(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    EntityHelper.assign(book, { title: 'Better Book2 1', author: god, notExisting: true });
    expect(book.author).toBe(god);
    expect((book as any).notExisting).toBe(true);
    await orm.em.persist(god);
    EntityHelper.assign(book, { title: 'Better Book2 2', author: god.id });
    expect(book.author).toBe(god);
    EntityHelper.assign(book, { title: 'Better Book2 3', author: jon._id });
    expect(book.title).toBe('Better Book2 3');
    expect(book.author).toBe(jon);
  });

  test('#assign() should update entity collection', async () => {
    const other = new BookTag('other');
    other.id = null;
    await orm.em.persist(other);
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    const tag1 = new BookTag('tag 1');
    const tag2 = new BookTag('tag 2');
    const tag3 = new BookTag('tag 3');
    book.tags.add(tag1);
    book.tags.add(tag2);
    book.tags.add(tag3);
    await orm.em.persist(book);
    book.assign({ tags: [other._id] });
    expect(book.tags.getIdentifiers('_id')).toMatchObject([other._id]);
    book.assign({ tags: [] });
    expect(book.tags.getIdentifiers()).toMatchObject([]);
    book.assign({ tags: [tag1.id, tag3.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag1.id, tag3.id]);
    book.assign({ tags: [tag2] });
    expect(book.tags.getIdentifiers('_id')).toMatchObject([tag2._id]);
    expect(() => book.assign({ tags: [{ foo: 'bar' }] })).toThrowError(`Invalid collection values provided for 'Book.tags' in Book.assign(): [{"foo":"bar"}]`);
    expect(() => book.assign({ publisher: [{ foo: 'bar' }] })).toThrowError(`Invalid reference value provided for 'Book.publisher' in Book.assign(): [{"foo":"bar"}]`);
  });

  test('should have string id getter and setter', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author._id = new ObjectID('5b0ff0619fbec620008d2414');
    expect(author.id).toBe('5b0ff0619fbec620008d2414');

    author.id = '5b0d19b28b21c648c2c8a600';
    expect(author._id).toEqual(new ObjectID('5b0d19b28b21c648c2c8a600'));
  });

  test('should have entitny manager getter and setter', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    expect(() => author.getEntityManager()).toThrowError('This entity is not attached to EntityManager, please provide one!');
    expect(author.getEntityManager(orm.em)).toBe(orm.em);

    const fork = orm.em.fork();
    expect(author.getEntityManager()).toBe(orm.em);
    author.setEntityManager(fork);
    expect(author.getEntityManager()).toBe(fork);
  });

  afterAll(async () => orm.close(true));

});